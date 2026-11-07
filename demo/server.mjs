// The demo server: serves the pages from src/ and answers their API calls from the fixture, with the placeholder video.
// No dependencies, no keys, no network. Start it with npm run dev (PORT and HOST can be set in .env, see .env.example).
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { DEMO_DIR } from './clips.mjs';
import { allPlans, CATALOG, find, plan, playlist, PlanError, siteMap, sites } from './planner.mjs';
import { PAGE } from '../src/page.mjs';
import { GUIDE_PAGE } from '../src/guide-page.mjs';
import { PRIVACY_PAGE } from '../src/privacy.mjs';
import { followThroughHtml, followThroughText } from '../src/follow-through.mjs';

const ROOT = path.resolve(DEMO_DIR, '..');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const PLANS = allPlans();

const TYPES = { '.woff2': 'font/woff2', '.js': 'text/javascript; charset=utf-8', '.mp4': 'video/mp4', '.m4s': 'video/iso.segment', '.txt': 'text/plain; charset=utf-8' };
const STATIC = [['/fonts/', path.join(ROOT, 'public', 'fonts')], ['/vendor/', path.join(ROOT, 'public', 'vendor')], ['/media/', path.join(ROOT, 'demo', 'media')]];

const send = (res, status, body, type, extra = {}) => { res.writeHead(status, { 'content-type': type, 'cache-control': 'no-cache', ...extra }); res.end(body); };
const html = (res, body) => send(res, 200, body, 'text/html; charset=utf-8');
const json = (res, body, status = 200) => send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
const notFound = (res) => json(res, { error: 'not found' }, 404);

function serveFile(res, urlPath) {
  for (const [prefix, dir] of STATIC) {
    if (!urlPath.startsWith(prefix)) continue;
    const file = path.resolve(dir, '.' + decodeURIComponent(urlPath.slice(prefix.length - 1)));
    const type = TYPES[path.extname(file)];
    if (!file.startsWith(dir + path.sep) || !type || !existsSync(file) || !statSync(file).isFile()) return notFound(res);
    res.writeHead(200, { 'content-type': type, 'content-length': statSync(file).size, 'cache-control': 'public, max-age=3600' });
    return createReadStream(file).pipe(res);
  }
  return null;
}

function readBody(req, limit = 4096) {
  return new Promise((ok, fail) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > limit) { fail(new PlanError('request too large')); req.destroy(); } });
    req.on('end', () => ok(body));
    req.on('error', fail);
  });
}

function remember(rec) { PLANS.set(rec.id, rec); return rec; }

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname, q = url.searchParams;
  if (req.method === 'POST' && p === '/api/match') {
    const b = JSON.parse((await readBody(req)) || '{}');
    const text = String(b.request ?? '').trim().slice(0, 300);
    if (!text) return json(res, { status: 'error', error: 'empty request' }, 400);
    const answer = find(b.site, b.device === 'desktop' ? 'desktop' : 'mobile', text);
    if (answer.plan) remember(answer.plan);
    return json(res, answer);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, { error: 'method not allowed' }, 405);
  if ((p === '/' || p === '/index.html') && q.get('c')) return send(res, 302, '', 'text/plain', { location: '/guide' + url.search });
  if (p === '/' || p === '/index.html') return html(res, PAGE);
  if (p === '/guide') return html(res, GUIDE_PAGE);
  if (p === '/privacy') return html(res, PRIVACY_PAGE);
  if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /\n', 'text/plain');
  if (p === '/favicon.ico') return send(res, 204, '', 'image/x-icon');
  if (serveFile(res, p) !== null) return;
  if (p === '/api/sites') return json(res, sites());
  let m = p.match(/^\/api\/map\/([a-z0-9-]+)$/);
  if (m) { const map = siteMap(m[1]); return map ? json(res, map) : notFound(res); }
  if (p === '/api/plan') {
    const tasks = (q.get('tasks') ?? '').split(',').filter(Boolean);
    return json(res, remember(plan(q.get('site') ?? '', q.get('device') ?? 'mobile', tasks)));
  }
  m = p.match(/^\/api\/combo\/([0-9a-f]{12})$/);
  if (m) return PLANS.has(m[1]) ? json(res, PLANS.get(m[1])) : notFound(res);
  m = p.match(/^\/c\/([0-9a-f]{12})\.m3u8$/);
  if (m) return PLANS.has(m[1]) ? send(res, 200, playlist(PLANS.get(m[1])), 'application/vnd.apple.mpegurl') : notFound(res);
  m = p.match(/^\/follow-through\/([0-9a-f]{12})(\.txt)?$/);
  if (m) {
    const rec = PLANS.get(m[1]);
    if (!rec) return notFound(res);
    const base = url.origin;
    return m[2] ? send(res, 200, followThroughText(rec, CATALOG, base), 'text/plain; charset=utf-8') : html(res, followThroughHtml(rec, CATALOG, base));
  }
  return notFound(res);
}

createServer((req, res) => {
  route(req, res).catch((err) => {
    const status = err instanceof PlanError ? 400 : err instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) json(res, { error: status === 500 ? 'something went wrong' : err.message, code: null }, status);
  });
}).listen(PORT, HOST, () => {
  console.log(`Demo running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/  (Ctrl+C to stop)`);
});

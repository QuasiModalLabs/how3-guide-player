import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
let server;

before(async () => {
  server = spawn(process.execPath, ['demo/server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((ok, fail) => {
    server.stdout.on('data', (d) => { if (String(d).includes('Demo running')) ok(); });
    server.on('exit', (c) => fail(new Error('server exited ' + c)));
  });
});
after(() => server.kill());

test('pages, fonts, player library and privacy load', async () => {
  for (const p of ['/', '/guide', '/privacy', '/fonts/atkinson-hyperlegible-400-latin.woff2', '/vendor/hls.js/hls.min.js']) {
    const r = await fetch(BASE + p);
    assert.equal(r.status, 200, p);
  }
});

test('a guide builds, plays and has a Follow-Through', async () => {
  const rec = await (await fetch(`${BASE}/api/plan?site=example-council&device=mobile&tasks=bin-day,library-card`)).json();
  assert.equal(rec.tasks.length, 2);
  assert.equal((await fetch(`${BASE}/api/combo/${rec.id}`)).status, 200);
  const m3u8 = await (await fetch(BASE + rec.playlist)).text();
  const seg = m3u8.split('\n').find((l) => l.startsWith('/media/'));
  assert.equal((await fetch(BASE + seg)).status, 200);
  assert.match(await (await fetch(`${BASE}/follow-through/${rec.id}.txt`)).text(), /Your next steps/);
});

test('the finder answers with a plan; bad input and unknown paths are refused', async () => {
  const r = await fetch(`${BASE}/api/match`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site: 'example-council', device: 'mobile', request: 'library opening hours' }) });
  const b = await r.json();
  assert.equal(b.status, 'ok');
  assert.ok(b.plan.id);
  assert.equal((await fetch(`${BASE}/api/plan?site=example-council&tasks=nope`)).status, 400);
  assert.equal((await fetch(`${BASE}/media/../package.json`)).status, 404);
  assert.equal((await fetch(`${BASE}/fonts/..%2F..%2Fpackage.json`)).status, 404);
  assert.equal((await fetch(`${BASE}/nothing-here`)).status, 404);
});

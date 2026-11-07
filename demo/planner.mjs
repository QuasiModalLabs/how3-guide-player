// The demo backend's logic: builds a guide record (the shape the pages read, see API.md) from the fixture, finds tasks
// by keyword for the "Ask in your own words" box, and writes a guide's HLS playlist from the placeholder clips.
// It stands in for the real service, which plans guides from filmed clips and finds tasks with a language model.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { clipList, DEMO_DIR, SITE } from './clips.mjs';
import { haveReady } from '../src/have-ready.mjs';

const STAGES = ['eligibility', 'lookup', 'action', 'information'];
const CLIPS_JSON = path.join(DEMO_DIR, 'media', 'clips.json');
if (!existsSync(CLIPS_JSON)) throw new Error('demo/media/clips.json is missing: run npm run make:video');
const MEDIA = JSON.parse(readFileSync(CLIPS_JSON, 'utf8'));
const CLIPS = Object.fromEntries(clipList().map((c) => [c.id, c]));
const TASKS = Object.fromEntries(SITE.tasks.map((t) => [t.id, t]));

export class PlanError extends Error { constructor(msg) { super(msg); this.status = 400; } }

const round = (x) => Math.round(x * 1000) / 1000;
const guideLink = (device, task) => `/guide?site=${SITE.id}&device=${device}&tasks=${encodeURIComponent(task)}`;

/** The /api/sites body. */
export function sites() {
  return {
    sites: {
      [SITE.id]: {
        label: SITE.label, group: false, in_group: null,
        chips: SITE.chips.map((id) => ({ id, title: TASKS[id].title })),
        rights: [SITE.rights], voice: null, devices: Object.keys(MEDIA),
        tasks: SITE.tasks.map((t) => ({ id: t.id, title: t.title, stage: t.stage })),
        rules: 0, limits: SITE.limits,
      },
    },
  };
}

/** The /api/map/<site> body: pages as nodes, every filmed step and way back as an edge. */
export function siteMap(site) {
  if (site !== SITE.id) return null;
  const nodes = Object.entries(SITE.pages).map(([id, p]) => ({ id, title: p.title, hub: p.hub, depth: p.depth }));
  const steps = Object.fromEntries(clipList().filter((c) => c.from).map((c) => [c.id, { from: c.from, to: c.to, kind: c.kind }]));
  return { home: SITE.home, nodes, steps };
}

/** A guide record for these tasks, in a sensible order: checks first, then lookups, actions and information. */
export function plan(site, device, wanted) {
  if (site !== SITE.id) throw new PlanError(`unknown site: ${site}`);
  if (!MEDIA[device]) throw new PlanError(`unknown device: ${device}`);
  const ids = [...new Set(wanted)];
  if (!ids.length) throw new PlanError('pick at least one task');
  for (const id of ids) if (!TASKS[id]) throw new PlanError(`unknown task: ${id}`);
  const ordered = ids.map((id, i) => ({ id, i })).sort((a, b) => (STAGES.indexOf(TASKS[a.id].stage) - STAGES.indexOf(TASKS[b.id].stage)) || a.i - b.i).map((x) => x.id);
  const tasks = ordered.slice(0, SITE.limits.maxTasks);
  const over = ordered.slice(SITE.limits.maxTasks);

  const timeline = [], items = [], returns = [];
  let t = 0;
  const add = (clipId, task) => {
    const c = CLIPS[clipId], s = MEDIA[device][clipId].seconds;
    timeline.push({ id: clipId, kind: c.kind, role: c.role, task, start_s: round(t), end_s: round(t + s) });
    items.push({ kind: c.kind, id: clipId, task, role: c.role });
    t += s;
  };
  tasks.forEach((id, k) => {
    const task = TASKS[id];
    if (k === 0) add(`card-${id}-intro`, id);
    else {
      const prev = tasks[k - 1], ret = CLIPS[`ret-${prev}`];
      add(ret.id, id);
      returns.push({ after_task: prev, before_task: id, id: ret.id, from: ret.from, to: ret.to, via: 'menu', clicks: 1 });
    }
    if (task.you_will_need) add(`card-${id}-need`, id);
    task.segments.forEach((_, i) => add(`seg-${id}-${i + 1}`, id));
  });
  add('card-end', tasks.at(-1));
  const total = round(t);

  const titles = Object.fromEntries(tasks.map((id) => [id, TASKS[id].title]));
  const chapters = tasks.map((id) => {
    const mine = timeline.filter((x) => x.task === id);
    return { task: id, title: titles[id], start_s: mine[0].start_s, end_s: mine.at(-1).end_s };
  });
  chapters[0].start_s = 0;
  // Why this order: the demo only says "check eligibility first" when the earlier task is a check, and "the order you
  // asked for" when nothing was moved; otherwise it gives no reason (the real planner has the site's ordering rules).
  const asked = ids.slice(0, tasks.length).join(',') === tasks.join(',');
  const reasons = tasks.slice(1).flatMap((id, k) => {
    const before = tasks[k];
    if (TASKS[before].stage === 'eligibility' && TASKS[id].stage !== 'eligibility') return [{ type: 'stage', before, after: id }];
    return asked ? [{ type: 'stated', before, after: id }] : [];
  });
  const id = createHash('sha256').update(`${site}|${device}|${tasks.join(',')}`).digest('hex').slice(0, 12);
  const first = TASKS[tasks[0]];
  return {
    id, site, device, voice: null, narrated: false, tasks, titles,
    segments: timeline.filter((x) => x.kind === 'segment').map((x) => x.id),
    returns, items,
    also_needed: over.map((a) => ({ id: a, title: TASKS[a].title, guide: guideLink(device, a), why: 'over_budget' })),
    reasons,
    stats: { returns: returns.length, total_s: total, budget_s: SITE.limits.maxDurationSec, max_tasks: SITE.limits.maxTasks, over_budget: over.length > 0 },
    chapters, total_s: total, timeline,
    guide: { site_name: SITE.label, host: SITE.host, ...SITE.colours, pages: Object.fromEntries(tasks.map((x) => [x, { page_url: TASKS[x].page_url }])) },
    have_ready: haveReady(items, TASKS, titles),
    start_here: { task: first.id, url: first.start_url ?? first.page_url, title: first.title },
    playlist: `/c/${id}.m3u8`,
  };
}

/** The HLS playlist: the guide's clips one after another (each clip starts its own timestamps, hence the
 *  discontinuity tags; the real service rewrites timestamps so the joins need none). */
export function playlist(rec) {
  const out = ['#EXTM3U', '#EXT-X-VERSION:7', '#EXT-X-TARGETDURATION:2', '#EXT-X-MEDIA-SEQUENCE:0', '#EXT-X-PLAYLIST-TYPE:VOD'];
  rec.timeline.forEach((x, i) => {
    const base = `/media/${rec.device}/${x.id}`;
    if (i) out.push('#EXT-X-DISCONTINUITY');
    out.push(`#EXT-X-MAP:URI="${base}/init.mp4"`);
    for (const s of MEDIA[rec.device][x.id].segments) out.push(`#EXTINF:${s.seconds.toFixed(6)},`, `${base}/${s.file}`);
  });
  out.push('#EXT-X-ENDLIST');
  return out.join('\n') + '\n';
}

/** The demo finder: plain keyword matching, no language model. Same answer shape as the real finder. */
export function find(site, device, text) {
  if (site !== SITE.id) throw new PlanError(`unknown site: ${site}`);
  const said = ' ' + String(text).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const hits = SITE.tasks
    .map((t) => ({ t, score: t.keywords.filter((k) => said.includes(' ' + k + ' ') || said.includes(' ' + k + 's ')).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const chips = SITE.chips.map((id) => ({ id, title: TASKS[id].title }));
  if (!hits.length) return { status: 'ok', cached: false, demo: true, tasks: [], uncovered: [{ kind: 'unclear', phrase: text, chips }], official_url: SITE.origin };
  const rec = plan(site, device, hits.map((x) => x.t.id));
  return { status: 'ok', cached: false, demo: true, tasks: rec.tasks.map((id) => ({ id, title: TASKS[id].title })), uncovered: [], official_url: SITE.origin, plan: rec };
}

/** Every guide the demo can make, by id, so a guide link still opens after the server restarts. */
export function allPlans() {
  const ids = SITE.tasks.map((t) => t.id), out = new Map();
  const orders = (left, n) => (n === 0 ? [[]] : left.flatMap((x) => orders(left.filter((y) => y !== x), n - 1).map((r) => [x, ...r])));
  for (const device of Object.keys(MEDIA)) {
    for (let n = 1; n <= ids.length; n++) for (const o of orders(ids, n)) { const r = plan(SITE.id, device, o); out.set(r.id, r); }
  }
  return out;
}

/** The pseudo-catalog the Follow-Through reads (titles, official links, the rights line). */
export const CATALOG = { sites: { [SITE.id]: { catalog: { tasks: Object.fromEntries(SITE.tasks.map((t) => [t.id, { title: t.title, page_url: t.page_url, start_url: t.start_url ?? null, site: SITE.id }])), rights: SITE.rights } } } };

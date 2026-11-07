import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allPlans, find, plan, playlist, siteMap } from '../demo/planner.mjs';
import { mapRoute, mapPosition, mapLine } from '../src/map.mjs';

test('tasks are ordered lookups, then actions, then information; over the limit goes to Also needed', () => {
  const r = plan('example-council', 'mobile', ['library-hours', 'parking-permit', 'bin-day', 'library-card']);
  assert.deepEqual(r.tasks, ['bin-day', 'parking-permit', 'library-card']);
  assert.deepEqual(r.also_needed.map((a) => a.id), ['library-hours']);
  assert.deepEqual(r.reasons, []); // reordered, and no task is an eligibility check: no reason to claim
  const kept = plan('example-council', 'mobile', ['bin-day', 'library-card']);
  assert.deepEqual(kept.reasons, [{ type: 'stated', before: 'bin-day', after: 'library-card' }]);
});

test('the timeline is continuous, with one stop per task and the chapters covering it', () => {
  const r = plan('example-council', 'desktop', ['bin-day', 'library-card']);
  for (let i = 1; i < r.timeline.length; i++) assert.equal(r.timeline[i].start_s, r.timeline[i - 1].end_s);
  assert.equal(r.timeline.at(-1).end_s, r.total_s);
  assert.equal(r.chapters[0].start_s, 0);
  assert.equal(r.chapters.at(-1).end_s, r.total_s);
  assert.equal(r.timeline[0].role, 'intro');
  assert.equal(r.timeline.at(-1).role, 'end');
  assert.ok(r.timeline.some((x) => x.kind === 'return' && x.task === 'library-card'));
});

test('Have ready lists the you-will-need items, and the need card comes before the first step', () => {
  const r = plan('example-council', 'mobile', ['library-card']);
  assert.deepEqual(r.have_ready.all_items, ['proof of your address, such as a recent letter', 'a photo ID']);
  const need = r.timeline.find((x) => x.role === 'need'), seg = r.timeline.find((x) => x.kind === 'segment');
  assert.ok(need.end_s <= seg.start_s);
  assert.equal(plan('example-council', 'mobile', ['bin-day']).have_ready, null);
});

test('the playlist lists every clip, and its lengths add up to the timeline', () => {
  const r = plan('example-council', 'mobile', ['bin-day', 'library-hours']);
  const m3u8 = playlist(r);
  const total = [...m3u8.matchAll(/#EXTINF:([\d.]+)/g)].reduce((a, m) => a + Number(m[1]), 0);
  assert.ok(Math.abs(total - r.total_s) < 0.01);
  assert.equal((m3u8.match(/#EXT-X-MAP/g) || []).length, r.timeline.length);
  assert.ok(m3u8.trimEnd().endsWith('#EXT-X-ENDLIST'));
});

test('the map has every step of the route, and the playhead follows it', () => {
  const r = plan('example-council', 'mobile', ['bin-day', 'parking-permit']);
  const route = mapRoute(r, siteMap('example-council'));
  assert.deepEqual(route.map((x) => x.id), ['seg-bin-day-1', 'seg-bin-day-2', 'ret-bin-day', 'seg-parking-permit-1', 'seg-parking-permit-2']);
  assert.deepEqual(mapPosition(route, 0), { at: '/' });
  assert.deepEqual(mapLine(route).stops, ['/', '/bins', '/bins/collection-day', '/', '/parking', '/parking/resident-permit']);
});

test('the demo finder matches keywords, and offers chips when nothing matches', () => {
  const a = find('example-council', 'mobile', 'When are my bins collected? And I need a parking permit');
  assert.deepEqual(a.tasks.map((t) => t.id).sort(), ['bin-day', 'parking-permit']);
  assert.ok(a.plan.id);
  const b = find('example-council', 'mobile', 'renew my passport');
  assert.equal(b.tasks.length, 0);
  assert.equal(b.uncovered[0].kind, 'unclear');
});

test('every guide id is known up front, and unknown input is refused', () => {
  const all = allPlans();
  const r = plan('example-council', 'mobile', ['library-card', 'bin-day']);
  assert.deepEqual(all.get(r.id).tasks, r.tasks);
  assert.throws(() => plan('example-council', 'mobile', ['nope']), /unknown task/);
  assert.throws(() => plan('elsewhere', 'mobile', ['bin-day']), /unknown site/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, CATALOG } from '../demo/planner.mjs';
import { answerHtml, planCardHtml } from '../src/plan-card.mjs';
import { followThroughHtml, followThroughText } from '../src/follow-through.mjs';
import { haveReadyHoldS } from '../src/have-ready.mjs';

const rec = plan('example-council', 'mobile', ['bin-day', 'library-card']);

test('the plan card shows chapters, why this order and the way back between tasks', () => {
  const h = planCardHtml(rec, 'Example Council (demo)', {}, 12);
  assert.match(h, /Chapters/);
  assert.match(h, /Check your bin collection day before Join the library/);
  assert.match(h, /1 click back through the site/);
  assert.match(h, /built in 12 ms/);
  assert.ok(!h.includes('undefined'));
});

test('the answer shows what was understood, or chips when unclear', () => {
  assert.match(answerHtml({ tasks: [{ id: 'bin-day', title: 'Check your bin collection day' }], uncovered: [] }, 800), /Understood in 0\.8 s/);
  assert.match(answerHtml({ tasks: [], uncovered: [{ kind: 'unclear', chips: [{ id: 'bin-day', title: 'Bins' }] }], official_url: 'https://example.org' }, 0), /Did you mean\?/);
});

test('the Follow-Through text carries Have ready, the guide link and each official page', () => {
  const t = followThroughText(rec, CATALOG, 'http://localhost:8787');
  assert.match(t, /^Your next steps/);
  assert.match(t, /Have ready/);
  assert.match(t, /http:\/\/localhost:8787\/guide\?c=[0-9a-f]{12}&device=mobile/);
  assert.match(t, /Official page: https:\/\/example\.org\/bins\/collection-day/);
  assert.match(followThroughHtml(rec, CATALOG, 'http://localhost:8787'), /Your checklist/);
});

test('the start screen reads for 3 to 8 seconds', () => {
  const s = haveReadyHoldS(rec.have_ready);
  assert.ok(s >= 3 && s <= 8);
});

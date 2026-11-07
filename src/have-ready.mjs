// Have ready: the items a guide's tasks say you'll need, de-duplicated, grouped under each task, trimmed to about
// six lines. Shown on the player's start screen and at the top of the Follow-Through.
export const HAVE_READY = { heading: 'Have ready', more: 'More in each step.', closing: 'Full details on each official page.', max_lines: 6 };
const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();

export function haveReady(items, tasks, titles = {}) {
  const order = [...new Set((items ?? []).filter((it) => it.role === 'need' && it.task).map((it) => it.task))];
  const seen = new Set();
  const sections = [];
  for (const tid of order) {
    const need = tasks?.[tid]?.you_will_need;
    if (!need) continue;
    const lines = [];
    for (const g of need.groups) {
      const fresh = g.items.filter((x) => { const k = norm(x); if (seen.has(k)) return false; seen.add(k); return true; });
      if (!fresh.length) continue; // every item already listed under an earlier task: its intro line goes too
      if (g.lead) lines.push({ kind: 'lead', text: g.lead });
      for (const x of fresh) lines.push({ kind: 'item', text: x });
    }
    if (lines.length) sections.push({ task: tid, title: titles[tid] ?? tasks[tid].title ?? tid, lines });
  }
  if (!sections.length) return null;
  const all_items = sections.flatMap((s) => s.lines.filter((l) => l.kind === 'item').map((l) => l.text));
  // Trim to the line budget: every task keeps its first item (with its intro line), then items are added a task at a
  // time in turn while the budget lasts.
  const total = sections.reduce((n, s) => n + s.lines.length, 0);
  let shown = sections.map((s) => ({ ...s, lines: s.lines }));
  let more = false;
  if (total > HAVE_READY.max_lines) {
    more = true;
    const take = sections.map((s) => { const first = s.lines.findIndex((l) => l.kind === 'item'); return first + 1; }); // lead (if any) + first item
    let used = take.reduce((a, b) => a + b, 0);
    for (let progress = true; progress && used < HAVE_READY.max_lines;) {
      progress = false;
      sections.forEach((s, i) => {
        if (used >= HAVE_READY.max_lines || take[i] >= s.lines.length) return;
        const next = s.lines[take[i]];
        const cost = next.kind === 'lead' ? 2 : 1; // an intro line only comes with the item after it
        if (used + cost > HAVE_READY.max_lines) return;
        take[i] += cost; used += cost; progress = true;
      });
    }
    shown = sections.map((s, i) => ({ ...s, lines: s.lines.slice(0, take[i]) }));
  }
  return { heading: HAVE_READY.heading, sections: shown, more, more_text: more ? HAVE_READY.more : null, closing: HAVE_READY.closing, all_items };
}

/** Words on the card (heading, task names, lines, closing): the silent card's reading time is about 0.25 s a word. */
export function haveReadyWords(h) {
  if (!h) return 0;
  const t = [h.heading, ...h.sections.flatMap((s) => [s.title, ...s.lines.map((l) => l.text)]), h.more_text ?? '', h.closing].join(' ');
  return t.split(/\s+/).filter(Boolean).length;
}
export const haveReadyHoldS = (h) => Math.min(8, Math.max(3, +(haveReadyWords(h) * 0.25).toFixed(2)));

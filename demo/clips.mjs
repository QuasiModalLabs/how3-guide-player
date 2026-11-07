// The demo's clip list, derived from the fixture. The placeholder video script renders one short clip per entry, and
// the demo planner joins them into a guide's timeline. In the real app each clip is a filmed step on the official
// website, made by a separate (private) pipeline.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEMO_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SITE = JSON.parse(readFileSync(path.join(DEMO_DIR, 'fixtures', 'example-council.json'), 'utf8'));
export const DEVICES = { mobile: { width: 540, height: 960 }, desktop: { width: 960, height: 540 } };

/** Every clip: { id, kind, role, task, seconds, from?, to?, lines } (lines = the text on the placeholder card). */
export function clipList(site = SITE) {
  const out = [];
  for (const t of site.tasks) {
    out.push({ id: `card-${t.id}-intro`, kind: 'card', role: 'intro', task: t.id, seconds: 3, lines: ['Your guide', t.title] });
    if (t.you_will_need) {
      const items = t.you_will_need.groups.flatMap((g) => g.items);
      out.push({ id: `card-${t.id}-need`, kind: 'card', role: 'need', task: t.id, seconds: 4, lines: ["You'll need", ...items] });
    }
    t.segments.forEach((s, i) => {
      out.push({ id: `seg-${t.id}-${i + 1}`, kind: 'segment', role: null, task: t.id, seconds: 4, from: s.from, to: s.to, lines: [site.pages[s.to].title, s.label] });
    });
    const last = t.segments.at(-1).to;
    out.push({ id: `ret-${t.id}`, kind: 'return', role: 'return', task: null, after: t.id, seconds: 3, from: last, to: site.home, lines: ['Next task', 'Back to the homepage'] });
  }
  out.push({ id: 'card-end', kind: 'card', role: 'end', task: null, seconds: 3, lines: ["That's everything", 'in this guide'] });
  return out;
}

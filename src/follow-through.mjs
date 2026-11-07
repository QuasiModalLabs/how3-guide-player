// The Follow-Through: the plan as a message (plain text for a text or an email) and as a page, built only from the
// guide record and the site catalog (titles, order, chapters, official links). No visitor text.
import { FONT_FACE_CSS, FONT_PRELOAD } from './fonts.mjs';
// A task's public entry page: a tool's start page, else the task page.
const publicEntryUrl = (task) => task?.start_url || task?.page_url || null;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };

export function followThroughModel(rec, manifest, base) {
  const cat = manifest.sites[rec.site]?.catalog ?? { tasks: {} };
  const items = rec.tasks.map((t, i) => {
    const task = cat.tasks[t] ?? {};
    const pages = rec.guide?.pages?.[t] ?? {};
    const open = publicEntryUrl(task) ?? pages.page_url ?? null;
    const cont = null;
    const ch = (rec.chapters ?? []).find((c) => c.task === t);
    return { n: i + 1, task: t, title: rec.titles?.[t] ?? task.title ?? t, open, open_host: host(open), continue: cont, continue_host: host(cont), site: task.site ?? rec.site, chapter_s: ch ? ch.start_s : null };
  });
  const sites = [...new Set(items.map((x) => x.site))];
  const rights = sites.map((s) => manifest.sites[s]?.catalog?.rights).filter(Boolean);
  const lines = [...new Set(rights.flatMap((r) => [r.attribution, r.unofficial]).filter(Boolean)), ...new Set(rights.map((r) => r.ai_voice).filter(Boolean))];
  const also = (rec.also_needed ?? []).map((a) => (typeof a === 'string' ? { id: a, title: rec.titles?.[a] ?? cat.tasks[a]?.title ?? a } : { id: a.id ?? a.task, title: a.title ?? rec.titles?.[a.id ?? a.task] ?? a.id }));
  return {
    guide_url: `${base}/guide?c=${rec.id}&device=${rec.device ?? 'mobile'}`, page_url: `${base}/follow-through/${rec.id}?device=${rec.device ?? 'mobile'}`, minutes: Math.max(1, Math.round((rec.total_s ?? 0) / 60)),
    items, also: also.map((a) => ({ ...a, url: `${base}/guide?site=${encodeURIComponent(rec.site)}&tasks=${encodeURIComponent(a.id)}` })), lines,
    accent: rec.guide?.button ?? '#1d6eb7',
    have_ready: rec.have_ready ?? null,
  };
}

/** Pure: the plain-text message (text message or email body). */
export function followThroughText(rec, manifest, base) {
  const m = followThroughModel(rec, manifest, base);
  const out = ['Your next steps', 'From our conversation today', ''];
  // "Have ready" at the top of the message, above the checklist
  if (m.have_ready) {
    const h = m.have_ready;
    out.push(h.heading);
    for (const sec of h.sections) { out.push(sec.title); for (const l of sec.lines) out.push(l.kind === 'lead' ? `  ${l.text}` : `  - ${l.text}`); }
    if (h.more_text) out.push(h.more_text);
    out.push(h.closing, '');
  }
  out.push(`Watch your guide (about ${m.minutes} min): ${m.guide_url}`, '');
  for (const x of m.items) {
    out.push(`${x.n}. ${x.title}`);
    if (x.open) out.push(`   Official page: ${x.open}`);
    if (x.continue) out.push(`   Continue on the official service: ${x.continue}`);
  }
  if (m.also.length) { out.push('', 'Also needed:'); for (const a of m.also) out.push(`- ${a.title}: ${a.url}`); }
  out.push('', `All of this on one page: ${m.page_url}`, '', 'This guide never asks for passwords, payment or personal details.', ...m.lines);
  return out.join('\n') + '\n';
}

/** The overview's lines: intro lines as text, items as a list (shared by the page). */
function readyLines(lines) {
  let out = '', open = false;
  for (const l of lines) {
    if (l.kind === 'lead') { if (open) { out += '</ul>'; open = false; } out += `<p class="lead">${esc(l.text)}</p>`; }
    else { if (!open) { out += '<ul>'; open = true; } out += `<li>${esc(l.text)}</li>`; }
  }
  return out + (open ? '</ul>' : '');
}

/** Pure: the page. */
export function followThroughHtml(rec, manifest, base) {
  const m = followThroughModel(rec, manifest, base);
  const items = m.items.map((x) => `<li class="step"><div class="num" aria-hidden="true">${x.n}</div><div class="body">
      <h3>${esc(x.title)}</h3>
      <div class="links">${x.chapter_s != null ? `<a class="watch" href="${esc(`${m.guide_url}&t=${x.chapter_s.toFixed(1)}`)}">Watch this step <span>${mmss(x.chapter_s)}</span></a>` : ''}
      ${x.open ? `<a class="official" href="${esc(x.open)}" rel="noopener">Open the official page on ${esc(x.open_host)} ↗</a>` : ''}
      ${x.continue ? `<a class="official" href="${esc(x.continue)}" rel="noopener">Continue on the official service: ${esc(x.continue_host)} ↗</a>` : ''}</div></div></li>`).join('\n');
  const hr = m.have_ready ? `<section class="ready" id="have-ready"><h2>${esc(m.have_ready.heading)}</h2>${m.have_ready.sections.map((sec) => `<h3>${esc(sec.title)}</h3>${readyLines(sec.lines)}`).join('')}${m.have_ready.more_text ? `<p class="note">${esc(m.have_ready.more_text)}</p>` : ''}<p class="note">${esc(m.have_ready.closing)}</p></section>` : '';
  const also = m.also.length ? `<section class="also"><h2>Also needed</h2><ul>${m.also.map((a) => `<li><a href="${esc(a.url)}">${esc(a.title)}</a></li>`).join('')}</ul></section>` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Your next steps</title>
<link rel="preload" as="font" type="font/woff2" crossorigin href="${FONT_PRELOAD[0]}"><style>${FONT_FACE_CSS}</style>
<style>
:root { --bg:#f4f5f7; --fg:#14171c; --muted:#5b6370; --line:#d9dde3; --card:#fff; --accent:${esc(m.accent)}; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0f1114; --fg:#e8eaed; --muted:#9aa3ae; --line:#2c3139; --card:#1b1e24; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#0f1114; --fg:#e8eaed; --muted:#9aa3ae; --line:#2c3139; --card:#1b1e24; color-scheme:dark; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:17px/1.5 "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width:640px; margin:0 auto; padding:24px max(16px, env(safe-area-inset-right)) 40px max(16px, env(safe-area-inset-left)); display:grid; gap:20px; }
header h1 { font-size:30px; line-height:1.15; margin:0; text-wrap:balance; }
header p { margin:6px 0 0; color:var(--muted); }
.video { display:flex; gap:14px; align-items:center; padding:16px; border-radius:14px; background:var(--accent); color:#fff; text-decoration:none; font-weight:700; font-size:19px; }
.video .play { flex:0 0 auto; width:46px; height:46px; border-radius:50%; background:rgba(255,255,255,.18); display:grid; place-items:center; }
.video .play::before { content:""; border-style:solid; border-width:9px 0 9px 15px; border-color:transparent transparent transparent #fff; margin-left:4px; }
.video small { display:block; font-weight:400; font-size:15px; opacity:.9; }
.video:focus-visible, a:focus-visible { outline:3px solid var(--fg); outline-offset:3px; }
h2 { font-size:15px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin:0 0 8px; }
ol.steps { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
.step { display:flex; gap:14px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
.num { flex:0 0 auto; width:32px; height:32px; border-radius:50%; border:2px solid var(--accent); color:var(--fg); display:grid; place-items:center; font-weight:700; }
.body { min-width:0; display:grid; gap:8px; }
.step h3 { margin:2px 0 0; font-size:19px; line-height:1.3; }
.links { display:grid; gap:6px; }
.links a { color:var(--fg); text-underline-offset:3px; overflow-wrap:anywhere; }
.watch { font-weight:700; }
.watch span { color:var(--muted); font-weight:400; font-variant-numeric:tabular-nums; }
.also ul { margin:0; padding-left:20px; }
.ready { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
.ready h3 { font-size:17px; margin:10px 0 2px; }
.ready ul { margin:0; padding-left:20px; }
.ready p.lead { margin:2px 0; color:var(--muted); }
.ready .note { margin:10px 0 0; color:var(--muted); font-size:15px; }
.safe { margin:0; padding:12px 14px; border-left:4px solid var(--accent); background:var(--card); border-radius:6px; font-size:15px; }
footer { color:var(--muted); font-size:13px; display:grid; gap:4px; }
footer p { margin:0; }
</style></head>
<body><main>
<header><h1>Your next steps</h1><p>From our conversation today</p></header>
${hr}
<a class="video" href="${esc(m.guide_url)}"><span class="play" aria-hidden="true"></span><span>Watch your guide<small>About ${m.minutes} min · ${m.items.length} step${m.items.length === 1 ? '' : 's'}, in order</small></span></a>
<section><h2>Your checklist</h2><ol class="steps">
${items}
</ol></section>
${also}
<p class="safe">This guide never asks for passwords, payment or personal details. Official pages open on the official site.</p>
<footer>${m.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</footer>
</main></body></html>`;
}

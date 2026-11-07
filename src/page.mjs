// The main page: the guide finder (ask in your own words, or pick tasks), a guide code box, and Send me this plan.
// Building a guide opens the player at /guide, handing over the plan and the finder's answer for this tab.
import { FONT_FACE_CSS, FONT_PRELOAD } from './fonts.mjs';
import { answerHtml, planCardHtml, HANDOFF_KEY } from './plan-card.mjs';
import { ogTags } from './og.mjs';
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Step-by-step guides</title>
${ogTags('home')}
<link rel="preload" as="font" type="font/woff2" crossorigin href="${FONT_PRELOAD[0]}"><style>${FONT_FACE_CSS}</style>
<style>
:root { --bg:#faf8f3; --fg:#1a1a1a; --muted:#5c5a55; --card:#ffffff; --line:#e4e0d6; --soft:#f2efe7; --accent:#1a1a1a; --ring:#ffdd00; --ringink:#1a1a1a; --ok:#2e6b3f; --bad:#b3261e;
  --shadow:0 1px 2px rgba(26,26,26,.06), 0 8px 24px rgba(26,26,26,.07); --lift:0 2px 4px rgba(26,26,26,.08), 0 14px 32px rgba(26,26,26,.10);
  --r-lg:18px; --r-md:12px; --font:"Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --t-head:22px; --t-sec:17px; --t-body:16px; --t-cap:13.5px; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#141412; --fg:#f3f0e8; --muted:#b5b0a5; --card:#1e1d1a; --line:#34322d; --soft:#25241f; --accent:#f3f0e8; --ok:#8fd19e; --bad:#ff8a80; --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35); --lift:0 2px 4px rgba(0,0,0,.45), 0 14px 32px rgba(0,0,0,.45); color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#141412; --fg:#f3f0e8; --muted:#b5b0a5; --card:#1e1d1a; --line:#34322d; --soft:#25241f; --accent:#f3f0e8; --ok:#8fd19e; --bad:#ff8a80; --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35); --lift:0 2px 4px rgba(0,0,0,.45), 0 14px 32px rgba(0,0,0,.45); color-scheme:dark; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:var(--t-body)/1.5 var(--font); -webkit-text-size-adjust:100%; }
main { max-width: 1040px; margin: 0 auto; padding: 20px max(16px, env(safe-area-inset-right)) 32px max(16px, env(safe-area-inset-left)); display:grid; gap:20px; }
@media (min-width: 900px) { main { grid-template-columns: minmax(0,1fr) 360px; align-items:start; } }
section { display:grid; gap:14px; align-content:start; min-width:0; }
h1 { font-size:var(--t-head); line-height:1.2; margin:0 0 6px; display:flex; align-items:center; gap:10px; }
h1::before { content:""; width:20px; height:20px; border-radius:50%; border:4px solid var(--ring); box-shadow:0 0 0 2px var(--ringink), inset 0 0 0 2px var(--ringink); flex:0 0 auto; }
.card { background:var(--card); border:1px solid var(--line); border-radius:var(--r-lg); padding:16px; box-shadow:var(--shadow); animation:fade .25s ease-out both; }
#plan > b, #review > b { font-size:var(--t-sec); display:block; margin:12px 0 4px; }
aside.card { display:grid; gap:10px; align-content:start; }
video { width:100%; max-height:78vh; background:#000; border-radius:var(--r-lg); display:block; box-shadow:var(--lift); }
label .muted { white-space:nowrap; }
label { display:flex; gap:10px; align-items:center; padding:4px 6px; min-height:44px; border-radius:10px; cursor:pointer; transition:background .15s; }
label:hover { background:var(--soft); }
label input[type=checkbox] { width:22px; height:22px; accent-color:var(--fg); flex:0 0 auto; }
select, input[type=text], button { font:inherit; min-height:44px; padding:9px 14px; border-radius:999px; border:1.5px solid var(--line); background:var(--card); color:var(--fg); }
select { padding-right:30px; }
input[type=text] { border-radius:var(--r-md); border-color:var(--fg); }
button { background:var(--fg); color:var(--bg); border:1.5px solid var(--fg); cursor:pointer; font-weight:700; transition:transform .12s, box-shadow .12s, background .15s; }
button:hover { box-shadow:var(--shadow); transform:translateY(-1px); }
button:active { transform:translateY(0); box-shadow:none; }
button.secondary { background:var(--card); color:var(--fg); }
button:disabled { opacity:.5; }
:focus-visible, input[type=text]:focus { outline:none; box-shadow:0 0 0 4px var(--ring), 0 0 0 6px var(--ringink); }
.row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.field { display:grid; gap:4px; flex:1 1 100%; min-width:0; padding:0; min-height:0; cursor:default; }
.field:hover { background:none; }
.field select { width:100%; min-width:0; }
.field span { font-size:var(--t-cap); color:var(--muted); font-weight:700; }
.muted { color:var(--muted); font-size:var(--t-cap); }
ol, ul { margin:6px 0; padding-left:20px; }
#plan ol { list-style:none; padding:0; display:flex; flex-wrap:wrap; gap:8px; counter-reset:ch; }
.ch { cursor:pointer; color:var(--fg); border:1.5px solid var(--line); border-radius:999px; padding:8px 14px; min-height:44px; display:inline-flex; align-items:center; gap:8px; background:var(--card); counter-increment:ch; transition:background .15s, border-color .15s; }
.ch::before { content:counter(ch); font-weight:700; }
.ch:hover { border-color:var(--fg); }
.ch.on { font-weight:700; background:var(--ring); color:var(--ringink); border-color:var(--ringink); }
.ch.on .muted { color:var(--ringink); }
.chip { border-radius:999px; background:var(--card); color:var(--fg); }
.ok { color:var(--ok); } .bad { color:var(--bad); }
code { font-size:12px; word-break:break-all; }
#answer { display:grid; gap:6px; }
.understood { background:var(--soft); border-radius:var(--r-md); padding:10px 12px; color:var(--fg); font-size:var(--t-body); }
.understood .ut { color:var(--muted); font-size:var(--t-cap); display:block; }
.sheet { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:flex-end; justify-content:center; z-index:10; }
.sheet[hidden] { display:none; }
.sheet .panel { width:min(560px, 100%); max-height:88vh; overflow:auto; background:var(--bg); border-radius:22px 22px 0 0; padding:16px max(16px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); display:grid; gap:12px; animation:up .25s ease-out both; box-shadow:var(--lift); }
.msg { background:var(--card); border:1.5px solid var(--line); border-radius:20px 20px 20px 6px; padding:14px 16px; white-space:pre-wrap; font-size:14.5px; overflow-wrap:anywhere; }
@keyframes fade { from { opacity:0; transform:translateY(4px); } }
@keyframes up { from { opacity:0; transform:translateY(24px); } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } button:hover { transform:none; } }
</style>
</head>
<body>
<main>
  <section>
    <video id="v" controls playsinline preload="auto"></video>
    <p class="muted" id="status">Type what you need, or pick guides below.</p>
    <div class="card" id="plan" hidden></div>
    
  </section>
  <aside class="card">
    <h1>Step-by-step guides</h1>
    <div class="row"><label class="field" for="site"><span>Site</span><select id="site"></select></label><label class="field" for="device"><span>Who's watching?</span><select id="device"><option value="mobile">On a phone</option><option value="desktop">On a computer</option></select></label></div>
    <p class="muted">Ask in your own words <span>(demo finder: keyword match)</span></p>
    <div class="row"><input type="text" id="ask" maxlength="300" placeholder="What do you need to do?" style="flex:1;min-width:0"><button id="askgo">Find guides</button></div>
    <div id="answer" class="muted"></div>
    <p class="muted">or pick guides</p>
    <div id="tasks"></div>
    <div class="row"><button id="go">Build and play</button></div>
    <p class="muted">or a guide code</p>
    <div class="row"><input type="text" id="cid" placeholder="12-character code" size="14"><button id="load" class="secondary">Play</button></div>
    
    <p class="muted"><small>Unofficial demo. The finder here matches keywords on this computer and sends nothing anywhere. <a href="/privacy">Privacy</a></small></p>
  </aside>
</main>
<div class="sheet" id="sheet" hidden><div class="panel" role="dialog" aria-modal="true" aria-labelledby="sheettitle">
  <b id="sheettitle" style="font-size:var(--t-head)">Send me this plan</b>
  <div class="row"><label class="field" for="sheetdev"><span>Who's watching?</span><select id="sheetdev"><option value="mobile">On a phone</option><option value="desktop">On a computer</option></select></label></div>
  <p class="muted">The same plan as a message: a text, an email or a link. This is what it says.</p>
  <div class="msg" id="msgtext">Loading…</div>
  <div class="row"><button id="copy" type="button">Copy message</button><a id="openft" href="#" target="_blank" rel="noopener">Open as a page ↗</a><button id="closesheet" class="secondary" type="button">Close</button></div>
</div></div>
<script src="/vendor/hls.js/hls.min.js"></script>
<script>
// Some bundlers wrap named inner functions in __name(); the functions inlined below may carry it.
function __name(f) { return f; }
const $ = (id) => document.getElementById(id);
const v = $('v');
const qs = new URLSearchParams(location.search);
const STAGE = { eligibility: 'check first', lookup: 'look it up', action: 'do it online', information: 'read about it' };
${planCardHtml.toString()}
${answerHtml.toString()}
const names = (site) => Object.fromEntries(((sites[site] && sites[site].tasks) || []).map((t) => [t.id, t.title]));
function openGuide(rec, extra) {
  try { sessionStorage.setItem('${HANDOFF_KEY}', JSON.stringify({ id: rec.id, rec, answer: extra.answer || null, ms: extra.ms ?? null, clientMs: extra.clientMs ?? null })); } catch (e) { /* storage blocked: the player loads the stored guide */ }
  $('status').textContent = 'Opening your guide…';
  location.assign('/guide?c=' + rec.id);
}
const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const mins = (s) => { const m = Math.floor(s / 60), r = Math.round(s % 60); return (m ? m + ' min' : '') + (r || !m ? (m ? ' ' : '') + r + ' s' : ''); };
const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let hls = null, sites = {}, combo = null;
const stats = window.__how3 = { engine: null, waiting: 0, stallMs: 0, playing: false, ended: false, startedAt: 0, wallMs: 0, errors: [], ranges: 0 };
let stallStart = 0;

function engine() {
  const want = qs.get('engine');
  const nativeOk = !!v.canPlayType('application/vnd.apple.mpegurl');
  const apple = /Apple/.test(navigator.vendor);
  if (want === 'native' || (!want && nativeOk && apple) || !(window.Hls && Hls.isSupported())) return 'native';
  return 'hls.js';
}

function play(src) {
  stats.engine = engine(); stats.waiting = 0; stats.stallMs = 0; stats.ended = false; stats.playing = false; stats.startedAt = 0; stats.errors = [];
  
  if (hls) { hls.destroy(); hls = null; }
  if (stats.engine === 'native') { v.src = src; }
  else {
    hls = new Hls({ enableWorker: true });
    hls.on(Hls.Events.ERROR, (e, d) => { stats.errors.push(d.details + (d.fatal ? ' (fatal)' : '')); render(); });
    hls.loadSource(src); hls.attachMedia(v);
  }
  v.play().catch(() => { $('status').textContent = 'Tap play to start (autoplay was blocked).'; });
}

v.addEventListener('playing', () => { if (!stats.startedAt) stats.startedAt = performance.now(); stats.playing = true; if (stallStart) { stats.stallMs += performance.now() - stallStart; stallStart = 0; } render(); });
v.addEventListener('waiting', () => { if (stats.startedAt && !v.seeking) { stats.waiting++; stallStart = performance.now(); } render(); });
v.addEventListener('seeking', () => { stallStart = 0; });
v.addEventListener('ended', () => { stats.ended = true; stats.wallMs = performance.now() - stats.startedAt; render(); });
v.addEventListener('error', () => { stats.errors.push('media error ' + (v.error && v.error.code)); render(); });
v.addEventListener('timeupdate', () => { stats.ranges = v.buffered.length; markChapter(); });

function render() {

}

function markChapter() {
  if (!combo) return;
  document.querySelectorAll('.ch').forEach((el) => {
    const s = +el.dataset.s, e = +el.dataset.e;
    el.classList.toggle('on', v.currentTime >= s && v.currentTime < e);
  });
}

function showPlan(rec, clientMs, serverTiming) {
  combo = rec;
  const p = $('plan'); p.hidden = false;
  p.innerHTML = planCardHtml(rec, sites[rec.site]?.label, names(rec.site), clientMs);
  p.querySelectorAll('.ch').forEach((el) => el.addEventListener('click', () => { v.currentTime = +el.dataset.s + 0.01; v.play(); }));
  $('send').addEventListener('click', openSheet);
  history.replaceState(null, '', '?c=' + rec.id + (qs.get('engine') ? '&engine=' + qs.get('engine') : ''));
}

async function build() {
  const tasks = [...document.querySelectorAll('#tasks input:checked')].map((i) => i.value);
  const t = performance.now();
  const r = await fetch('/api/plan?site=' + $('site').value + '&device=' + $('device').value + '&tasks=' + tasks.join(','));
  const body = await r.json();
  if (!r.ok) { $('status').textContent = 'That guide cannot be built: ' + body.error; return; }
  openGuide(body, { clientMs: performance.now() - t });
}

let asking = false, lastAsk = { key: '', at: 0 };
const ASK_REPEAT_MS = 10000;
window.__ask = { sent: 0, ignored: 0 };
async function ask() {
  const text = $('ask').value.trim();
  if (!text) return;
  const key = $('site').value + '|' + $('device').value + '|' + text.toLowerCase().replace(/\\s+/g, ' ');
  if (asking || (key === lastAsk.key && Date.now() - lastAsk.at < ASK_REPEAT_MS)) { window.__ask.ignored++; return; }
  asking = true; $('askgo').disabled = true;
  try { await askOnce(text, key); } finally { asking = false; $('askgo').disabled = false; }
}
async function askOnce(text, key) {
  $('answer').textContent = 'Finding guides...';
  const t = performance.now();
  window.__ask.sent++;
  const r = await fetch('/api/match', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site: $('site').value, device: $('device').value, request: text }) });
  const b = await r.json();
  lastAsk = { key, at: Date.now() };
  if (b.status === 'rate_limited') { $('answer').textContent = 'Too many requests. Please wait a minute.'; return; }
  if (b.status === 'fallback') { $('answer').textContent = 'The guide finder is resting right now. Pick guides below.'; return; }
  if (b.status !== 'ok') { $('answer').textContent = 'Something went wrong.'; return; }
  const ms = performance.now() - t;
  const h = answerHtml(b, ms);
  $('answer').innerHTML = h;
  $('answer').querySelectorAll('.chip').forEach((el) => el.addEventListener('click', () => {
    document.querySelectorAll('#tasks input').forEach((i) => { i.checked = i.value === el.dataset.id; });
    build();
  }));
  if (b.plan) openGuide(b.plan, { answer: { status: b.status, cached: b.cached, tasks: b.tasks, uncovered: b.uncovered, official_url: b.official_url }, ms });
}

async function sheetMessage() {
  let id = combo.id;
  if ($('sheetdev').value !== combo.device) {
    const r = await fetch('/api/plan?site=' + encodeURIComponent(combo.site) + '&device=' + $('sheetdev').value + '&tasks=' + combo.tasks.join(','));
    if (r.ok) id = (await r.json()).id;
  }
  $('openft').href = '/follow-through/' + id + '?device=' + $('sheetdev').value;
  $('msgtext').textContent = 'Loading…';
  const t = await fetch('/follow-through/' + id + '.txt');
  $('msgtext').textContent = t.ok ? await t.text() : 'Could not load the message.';
}
function openSheet() { $('sheet').hidden = false; $('sheetdev').value = combo.device; sheetMessage(); $('copy').focus({ preventScroll: true }); }
function closeSheet() { $('sheet').hidden = true; $('send')?.focus(); }
$('sheetdev').addEventListener('change', sheetMessage);
$('closesheet').addEventListener('click', closeSheet);
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });
$('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('msgtext').textContent); $('copy').textContent = 'Copied'; } catch { const r = document.createRange(); r.selectNodeContents($('msgtext')); getSelection().removeAllRanges(); getSelection().addRange(r); $('copy').textContent = 'Selected: copy it'; } });

async function loadId(id) {
  const r = await fetch('/api/combo/' + id);
  if (!r.ok) { $('status').textContent = 'No guide with the code ' + id; return; }
  const rec = await r.json();
  showPlan(rec, null, null);
  play('/c/' + id + '.m3u8');
}

function drawTasks() {
  const s = sites[$('site').value];
  $('tasks').innerHTML = s.tasks.map((t) => '<label><input type="checkbox" value="' + t.id + '"> ' + t.title + ' <span class="muted">(' + (STAGE[t.stage] ?? t.stage) + ')</span></label>').join('');
  $('status').textContent = 'Pick up to ' + s.limits.maxTasks + ' tasks. A guide stays under ' + Math.round(s.limits.maxDurationSec / 60) + ' minutes; anything that does not fit is listed as also needed. Or type a guide code.';
}

(async () => {
  if (matchMedia('(min-width: 900px)').matches) $('device').value = 'desktop';
  sites = (await (await fetch('/api/sites')).json()).sites;
  const offered = Object.entries(sites).filter(([id, s]) => !s.in_group || qs.get('site') === id);
  $('site').innerHTML = offered.map(([id, s]) => '<option value="' + id + '">' + escHtml(s.label || id) + '</option>').join('');
  $('site').addEventListener('change', drawTasks); drawTasks();
  $('go').addEventListener('click', build);
  $('askgo').addEventListener('click', ask);
  $('ask').addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); });
  $('load').addEventListener('click', () => loadId($('cid').value.trim()));
  if (qs.get('c')) loadId(qs.get('c'));
  else if (qs.get('tasks')) {
    if (qs.get('site') && sites[qs.get('site')]) { $('site').value = qs.get('site'); drawTasks(); }
    if (qs.get('device')) $('device').value = qs.get('device');
    const want = qs.get('tasks').split(',');
    document.querySelectorAll('#tasks input').forEach((i) => { i.checked = want.includes(i.value); });
    build();
  }
  
})();
</script>
</body>
</html>`;

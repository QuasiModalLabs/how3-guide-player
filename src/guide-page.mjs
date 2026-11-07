// The guide player: the start screen (Have ready, Start here), a progress bar by task, Replay / Next / Speed, a pause
// after each task, the end screen (Start here, Watch again, Send me this plan), the current task's official page link,
// the route map (a graph on a computer, a top-to-bottom line on a phone) and the plan card with chapters.
// Everything on screen is built from the guide record (see API.md), never from the video.
import { mapLayout, mapLine, mapLinePosition, mapPosition, mapRoute } from './map.mjs';
import { FONT_FACE_CSS, FONT_PRELOAD } from './fonts.mjs';
import { haveReadyWords } from './have-ready.mjs';
import { answerHtml, planCardHtml, HANDOFF_KEY } from './plan-card.mjs';
import { ogTags } from './og.mjs';
import { GUIDE_CARDS } from './cards.mjs';

export const GUIDE_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your guide</title>
${ogTags('guide')}
<script>
(function () {
  var q = new URLSearchParams(location.search), c = q.get('c'), E = window.__early = {};
  var json = function (r) { return r.ok ? r.json().then(function (j) { return { ok: true, j: j }; }) : { ok: false }; };
  var none = function () { return { ok: false }; };
  E.sites = fetch('/api/sites').then(json).catch(none);
  if (c) {
    E.combo = fetch('/api/combo/' + encodeURIComponent(c)).then(json).catch(none);
    E.map = E.combo.then(function (x) { return x.ok && x.j.site ? fetch('/api/map/' + encodeURIComponent(x.j.site)).then(function (r) { return { site: x.j.site, r: r }; }) : null; }).catch(function () { return null; });
  }
  var vid = document.createElement('video');
  E.native = !!vid.canPlayType('application/vnd.apple.mpegurl') && /Apple/.test(navigator.vendor);
  E.files = {};
  var abs = function (u, base) { return new URL(u, base || location.href).href; };
  E.prefetch = function (src) {
    if (E.native) return;
    var pl = abs(src);
    if (E.files[pl]) return;
    var text = fetch(pl).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; });
    E.files[pl] = { t0: performance.now(), p: text };
    text.then(function (t) {
      if (!t) return;
      var uris = [], m = t.match(/#EXT-X-MAP:URI="([^"]+)"/);
      if (m) uris.push(m[1]);
      t.split(/\\r?\\n/).forEach(function (l) { l = l.trim(); if (l && l[0] !== '#' && uris.length < 4) uris.push(l); });
      uris.forEach(function (u) {
        var k = abs(u, pl);
        if (!E.files[k]) E.files[k] = { t0: performance.now(), p: fetch(k).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).catch(function () { return null; }) };
      });
    });
  };
  if (c) E.prefetch('/c/' + encodeURIComponent(c) + '.m3u8');
  E.hls = E.native ? Promise.resolve(false) : new Promise(function (ok) {
    var s = document.createElement('script');
    s.src = '/vendor/hls.js/hls.min.js'; s.async = true;
    s.onload = function () { ok(true); }; s.onerror = function () { ok(false); };
    document.head.appendChild(s);
  });
})();
</script>
<link rel="preload" as="font" type="font/woff2" crossorigin href="${FONT_PRELOAD[0]}"><style>${FONT_FACE_CSS}</style>
<style>
:root { --bg:#f4f5f7; --fg:#14171c; --muted:#5b6370; --line:#d9dde3; --card:#fff;
  --panel:#16181d; --ptext:#ffffff; --pmuted:#c9ced6; --badge:#2a2e36; --badgetext:#e6e9ee;
  --button:#1d6eb7; --mark:#1d6eb7; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0f1114; --fg:#e8eaed; --muted:#9aa3ae; --line:#2c3139; --card:#1b1e24; } }
:root[data-theme="dark"] { --bg:#0f1114; --fg:#e8eaed; --muted:#9aa3ae; --line:#2c3139; --card:#1b1e24; }
* { box-sizing: border-box; }
html, body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.45 "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 16px; display:grid; gap:12px; }
.stage { position:relative; background:#000; border-radius:12px; overflow:hidden; }
video { width:100%; max-height:76vh; display:block; background:#000; }
.progress { display:flex; gap:4px; align-items:stretch; height:8px; }
.part { position:relative; flex:1 1 0; background:var(--line); border-radius:4px; overflow:hidden; min-width:6px; }
.part > i { position:absolute; inset:0 auto 0 0; width:0; background:var(--mark); border-radius:4px; }
.plabel { font-size:14px; color:var(--muted); min-height:20px; display:flex; flex-wrap:wrap; align-items:center; column-gap:6px; }
.plabel b { color:var(--fg); }
.plabel a { display:inline-flex; align-items:center; min-height:44px; padding:0 4px; color:var(--button); font-weight:700; text-underline-offset:3px; }
.plabel a:focus-visible { outline:3px solid var(--mark); outline-offset:2px; border-radius:4px; }
.overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(10,12,15,.35); }
.overlay[hidden] { display:none; }
.gcard { width:min(440px, 100%); background:var(--panel); color:var(--ptext); border-radius:18px 18px 18px 6px; padding:20px 20px 18px;
  box-shadow:0 18px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06); border-left:5px solid var(--mark); }
.badge { display:inline-flex; gap:6px; align-items:center; background:var(--badge); color:var(--badgetext); border-radius:999px; padding:3px 10px; font-size:12px; }
.badge b { letter-spacing:.06em; }
.badge::before { content:""; width:7px; height:7px; border-radius:50%; background:var(--mark); }
.gcard h2 { font-size:22px; line-height:1.25; margin:12px 0 6px; }
.gcard p { margin:0 0 14px; color:var(--pmuted); font-size:15px; }
.gbtn { display:block; width:100%; text-align:center; font:inherit; font-weight:700; font-size:18px; padding:13px 14px; border-radius:10px; border:0; cursor:pointer;
  background:var(--button); color:#fff; text-decoration:none; }
.gbtn:focus-visible, .glink:focus-visible { outline:3px solid #fff; outline-offset:3px; }
.glink { display:block; text-align:center; margin-top:10px; padding:11px 14px; border-radius:10px; border:1.5px solid rgba(255,255,255,.55); color:#fff; text-decoration:none; font-size:16px; }
.gsecondary { background:transparent; border:1.5px solid rgba(255,255,255,.55); color:#fff; margin-top:10px; font-weight:400; font-size:16px; }
.fine { font-size:13px; color:var(--pmuted); margin:14px 0 0; }
.nav { display:flex; gap:8px; }
.nbtn { flex:1 1 0; min-width:0; min-height:48px; font:inherit; font-weight:700; font-size:16px; line-height:1.2; padding:8px 10px; border-radius:10px;
  border:1.5px solid var(--line); background:var(--card); color:var(--fg); cursor:pointer; }
.nbtn:focus-visible { outline:3px solid var(--mark); outline-offset:2px; }
.nbtn[disabled] { opacity:.5; cursor:default; }
#speed { flex:0 0 auto; min-width:7.2em; }
#speed[aria-pressed="true"] { background:var(--button); color:#fff; border-color:var(--button); }
@media (max-width: 380px) { .nbtn { font-size:15px; padding:8px 6px; } #speed { min-width:6.4em; } }
.controls { display:flex; flex-wrap:wrap; gap:10px 16px; align-items:center; font-size:15px; }
.switch { display:inline-flex; gap:8px; align-items:center; cursor:pointer; }
.switch input { width:20px; height:20px; accent-color:var(--button); }
.pick { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px; display:grid; gap:8px; }
.pick select, .pick button { font:inherit; padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--fg); }
.pick button { background:var(--button); color:#fff; border:0; }
.pick label { display:flex; gap:8px; align-items:center; }
.row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.muted { color:var(--muted); font-size:13px; }
.mapbox { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
.mapbox summary { cursor:pointer; font-weight:700; }
.mapwrap { overflow-x:auto; margin-top:8px; max-width:100%; }
main > * { min-width:0; }
#map { display:block; min-width:100%; height:auto; }
#map .edge { stroke:var(--line); stroke-width:1.5; fill:none; }
#map .route { stroke:var(--mark); stroke-width:3.5; fill:none; stroke-linecap:round; }
#map .jump { stroke:var(--mark); stroke-width:2; stroke-dasharray:5 5; fill:none; }
#map .node { fill:var(--card); stroke:var(--muted); stroke-width:1.5; }
#map .node.hub { stroke-width:2.5; }
#map .node.on { fill:var(--mark); stroke:var(--mark); }
#map text { font-size:12px; fill:var(--fg); paint-order:stroke; stroke:var(--card); stroke-width:4px; stroke-linejoin:round; }
#map text.lane { font-size:13px; font-weight:700; fill:var(--muted); }
#map .head { fill:#fff; stroke:var(--mark); stroke-width:4; }
.vmap { list-style:none; margin:8px 0 0; padding:0; position:relative; }
.vmap[hidden] { display:none; }
.vmap li { position:relative; padding:7px 0 7px 38px; min-height:34px; font-size:15px; line-height:1.3; overflow-wrap:anywhere; }
.vmap li::before, .vmap li::after { content:""; position:absolute; left:14px; border-left:3.5px solid var(--mark); }
.vmap li::before { top:0; height:50%; } .vmap li::after { top:50%; bottom:0; }
.vmap li:first-child::before, .vmap li:last-child::after { display:none; }
.vmap li.jump::before, .vmap li.site::before, .vmap li.site::after, .vmap li.site + li::before { border-left-style:dashed; }
.vmap li.site { font-weight:700; color:var(--muted); font-size:13px; letter-spacing:.02em; min-height:0; }
.vmap .vdot { position:absolute; left:8px; top:calc(50% - 8px); width:16px; height:16px; border-radius:50%; background:var(--mark); z-index:1; }
.vmap .vdot.hub { left:4px; top:calc(50% - 12px); width:24px; height:24px; background:var(--card); border:4px solid var(--mark); box-sizing:border-box; }
.vmap .vhead { position:absolute; left:6px; top:-30px; width:20px; height:20px; border-radius:50%; background:#fff; border:4px solid var(--mark); box-sizing:border-box; z-index:2; transition:top .12s linear;
  box-shadow:0 0 0 3px var(--card), 0 0 0 6px var(--fg), 0 2px 8px 6px rgba(0,0,0,.25); } /* "you are here": a ring no hub has */
@media (prefers-reduced-motion: reduce) { .vmap .vhead { transition:none; } }
.hrcard { width:min(480px, 100%); max-height:100%; overflow:auto; background:var(--panel); color:var(--ptext); border-radius:18px 18px 18px 6px; padding:18px 18px 16px;
  box-shadow:0 18px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.06); border-left:5px solid var(--mark); }
.hrcard h2 { font-size:21px; margin:10px 0 8px; }
.hrcard h3 { font-size:15px; margin:10px 0 2px; color:var(--ptext); }
.hrcard ul { margin:0; padding-left:20px; }
.hrcard li, .hrcard .lead { font-size:15px; line-height:1.35; color:var(--pmuted); margin:2px 0; }
.hrcard .lead { margin:2px 0; }
.hrcard .more, .hrcard .close { font-size:14px; color:var(--pmuted); margin:10px 0 0; }
.hrcard .gbtn { margin-top:12px; font-size:17px; padding:11px 14px; }
.hrcard .count { font-size:13px; color:var(--pmuted); text-align:center; margin:6px 0 0; min-height:18px; }
@media (max-width: 480px) { .hrcard { padding:14px 14px 12px; } .hrcard h2 { font-size:19px; } .hrcard li, .hrcard .lead { font-size:14px; } }
#haveready[hidden] { display:none; }
.hrcard .lead-in { font-size:18px; line-height:1.35; color:var(--ptext); margin:12px 0 2px; font-weight:400; }
.hrcard h2.lead-in { font-size:22px; line-height:1.3; margin:14px 0 4px; }
.gcard .gempathy { color:var(--ptext); font-size:16px; margin:0 0 14px; }
.starthere { margin:12px 0 0; font-size:16px; color:var(--pmuted); }
.starthere a { color:#fff; font-weight:700; text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }
.starthere a:focus-visible { outline:3px solid #fff; outline-offset:2px; border-radius:2px; }
.starthere.above { margin:10px 0 2px; }
.gcard .glink.primary { background:var(--button); border-color:var(--button); font-weight:700; }
@media (max-width: 480px) { .hrcard .lead-in { font-size:16px; } .hrcard h2.lead-in { font-size:20px; } .starthere { font-size:15px; } }
.plancard, .answer { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-size:15px; }
.plancard[hidden], .answer[hidden] { display:none; }
.plancard > b { display:block; font-size:16px; margin:12px 0 4px; }
.plancard ul { margin:4px 0; padding-left:20px; }
.plancard ol { list-style:none; padding:0; margin:6px 0; display:flex; flex-wrap:wrap; gap:8px; }
.plancard .ch { cursor:pointer; border:1.5px solid var(--line); border-radius:999px; padding:8px 14px; min-height:44px; display:inline-flex; align-items:center; gap:8px; background:var(--card); }
.plancard .ch.on { font-weight:700; border-color:var(--mark); }
.plancard code { font-size:12px; word-break:break-all; }
.plancard button, .answer .chip, .sheet button { font:inherit; font-weight:700; min-height:44px; padding:9px 16px; border-radius:10px; border:0; background:var(--button); color:#fff; cursor:pointer; }
.answer { display:grid; gap:6px; }
.answer .chip { background:var(--card); color:var(--fg); border:1.5px solid var(--line); font-weight:400; margin:2px 0; }
.understood { background:var(--bg); border-radius:10px; padding:10px 12px; }
.understood .ut { color:var(--muted); font-size:13px; display:block; }
.sheet { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:flex-end; justify-content:center; z-index:10; }
.sheet[hidden] { display:none; }
.sheet .panel { width:min(560px, 100%); max-height:88vh; overflow:auto; background:var(--bg); color:var(--fg); border-radius:22px 22px 0 0; padding:16px max(16px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); display:grid; gap:12px; }
.sheet select { font:inherit; min-height:44px; padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--fg); width:100%; }
.sheet .secondary { background:var(--card); color:var(--fg); border:1.5px solid var(--line); }
.sheet .field { display:grid; gap:4px; flex:1 1 100%; }
.sheet .field span { font-size:13px; color:var(--muted); font-weight:700; }
.msg { background:var(--card); border:1.5px solid var(--line); border-radius:20px 20px 20px 6px; padding:14px 16px; white-space:pre-wrap; font-size:14.5px; overflow-wrap:anywhere; }
/* the video area is tall enough for the card even before the video has loaded */
.stage.hr-open { min-height:min(560px, 76vh); }
@media (max-width: 480px) { .stage.hr-open { min-height:min(640px, 76vh); } }
@media (max-width: 767px) { main > .mapbox { order:1; } main > .answer, main > .plancard, main > .pick, main > p.muted { order:2; } }
@media (min-width: 1100px) { main { max-width:1240px; grid-template-columns:minmax(0,760px) minmax(0,1fr); align-items:start; } main > * { grid-column:1; } main > .mapbox { grid-column:2; grid-row:1 / span 9; position:sticky; top:16px; } }
</style>
</head>
<body>
<main>
  <div class="stage" id="stage">
    <video id="v" controls playsinline preload="auto"></video>
    <div class="overlay" id="ov" hidden aria-live="polite"></div>
    <div class="overlay" id="hr" hidden role="dialog" aria-labelledby="hrtitle"></div>
  </div>
  <div class="progress" id="bar" aria-hidden="true"></div>
  <div class="plabel" id="plabel"></div>
  <div class="nav" role="group" aria-label="Guide controls">
    <button class="nbtn" id="replay" type="button">Replay this step</button>
    <button class="nbtn" id="next" type="button">Next step</button>
    <button class="nbtn" id="speed" type="button" aria-pressed="false">Speed 1×</button>
  </div>
  <button class="nbtn" id="haveready" type="button" hidden>Have ready</button>
  <div class="controls">
    <label class="switch"><input type="checkbox" id="pauses" checked> Pause after each task</label>
    <span class="muted" id="status"></span>
  </div>
  <div class="answer" id="answer" hidden aria-live="polite"></div>
  <div class="plancard" id="plan" hidden></div>
  <details class="mapbox" id="mapbox">
    <summary>Map of this guide</summary>
    <div class="mapwrap"><svg id="map" role="img" aria-label="Map of the pages this guide visits"></svg><ol class="vmap" id="vmap" hidden aria-label="The pages this guide visits, in order"></ol></div>
    <p class="muted" id="maplegend">Large circles are the site's main hub pages; the coloured line is this guide's route; the white dot follows the video.</p>
  </details>
  <details class="pick" id="pick">
    <summary>Choose guides</summary>
    <div class="row"><select id="site"></select><select id="device"><option>mobile</option><option>desktop</option></select></div>
    <div id="tasks"></div>
    <div class="row"><button id="go">Build and play</button></div>
  </details>
  <p class="muted">Unofficial demo. Not affiliated with any government website it shows. <a href="/privacy">Privacy</a></p>
</main>
<div class="sheet" id="sheet" hidden><div class="panel" role="dialog" aria-modal="true" aria-labelledby="sheettitle">
  <b id="sheettitle" style="font-size:22px">Send me this plan</b>
  <div class="row"><label class="field" for="sheetdev"><span>Who's watching?</span><select id="sheetdev"><option value="mobile">On a phone</option><option value="desktop">On a computer</option></select></label></div>
  <p class="muted">The same plan as a message: a text, an email or a link. This is what it says.</p>
  <div class="msg" id="msgtext">Loading…</div>
  <div class="row"><button id="copy" type="button">Copy message</button><a id="openft" href="#" target="_blank" rel="noopener">Open as a page ↗</a><button id="closesheet" class="secondary" type="button">Close</button></div>
</div></div>
<script>
// Some bundlers wrap named inner functions in __name(); the functions inlined below may carry it.
function __name(f) { return f; }
const $ = (id) => document.getElementById(id);
${mapRoute.toString()}
${mapPosition.toString()}
${mapLayout.toString()}
${mapLine.toString()}
${mapLinePosition.toString()}
${planCardHtml.toString()}
${answerHtml.toString()}
const v = $('v'), ov = $('ov');
const qs = new URLSearchParams(location.search);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let hls = null, combo = null, sites = {}, parts = [], stops = [], nextStop = 0, raf = 0, timer = 0, pending = null;
let skipNeed = null;
function needClipOfTask1(rec) {
  const tl = rec.timeline || [], t1 = rec.tasks[0];
  const clip = tl.find((x) => x.task === t1 && x.kind === 'card' && x.role === 'need');
  const firstSeg = tl.find((x) => x.task === t1 && x.kind === 'segment');
  return clip && firstSeg && clip.end_s <= firstSeg.start_s + 0.01 ? { start_s: clip.start_s, end_s: clip.end_s, id: clip.id } : null;
}
// The player's state, readable from the browser console and by browser tests.
const G = window.__guide = { stops: [], starts: [], pauses: [], resumes: [], replays: [], nexts: [], jumps: [], speeds: [], skips: [], ready: false, ended: false, cards: {} };
const CARDS = ${JSON.stringify(GUIDE_CARDS).replace(/</g, '\\u003c')};
const cardLine = (pl, cls, tag) => CARDS[pl] ? '<' + (tag || 'p') + ' class="' + cls + '" data-card="' + esc(CARDS[pl].id) + '"' + (tag === 'h2' ? ' id="hrtitle"' : '') + '>' + esc(CARDS[pl].text) + '</' + (tag || 'p') + '>' : '';

const SPEED_KEY = 'how3.guide.speed';
function loadSpeed() { try { return Number(localStorage.getItem(SPEED_KEY)) === 0.75 ? 0.75 : 1; } catch (e) { return 1; } }
function saveSpeed(x) { try { localStorage.setItem(SPEED_KEY, String(x)); } catch (e) { /* storage blocked: the page still works */ } }
let pref = loadSpeed();
function applySpeed(x) {
  v.preservesPitch = true; v.webkitPreservesPitch = true; v.mozPreservesPitch = true; // natural voice pitch when slowed
  v.defaultPlaybackRate = x; v.playbackRate = x;
}
const fmtRate = (r) => String(Math.round(r * 100) / 100) + '×';
function showSpeed() {
  const r = v.playbackRate;
  $('speed').textContent = 'Speed ' + fmtRate(r);
  if (Math.abs(r - 1) > 0.001) $('speed').setAttribute('data-slow', ''); else $('speed').removeAttribute('data-slow');
  G.rate = r;
}

function engine() {
  if (window.__early.native || !(window.Hls && Hls.isSupported())) return 'native';
  return 'hls.js';
}
let EarlyLoader = null;
function earlyLoader() {
  if (EarlyLoader) return EarlyLoader;
  const Base = Hls.DefaultConfig.loader;
  EarlyLoader = class extends Base {
    load(context, config, callbacks) {
      const files = window.__early.files || {};
      const k = new URL(context.url, location.href).href;
      const e = files[k];
      if (!e || context.rangeStart || context.rangeEnd) return super.load(context, config, callbacks);
      delete files[k];
      this.context = context; this.callbacks = callbacks; this.gone = false;
      e.p.then((data) => {
        if (this.gone) return;
        if (data == null) { super.load(context, config, callbacks); return; }
        const now = performance.now(), st = this.stats, n = typeof data === 'string' ? data.length : data.byteLength;
        st.loading.start = e.t0; st.loading.first = Math.max(e.t0, now - 1); st.loading.end = now;
        st.loaded = st.total = n;
        G.early = (G.early || 0) + 1;
        const body = context.responseType === 'arraybuffer' ? (typeof data === 'string' ? new TextEncoder().encode(data).buffer : data) : (typeof data === 'string' ? data : new TextDecoder().decode(data));
        callbacks.onSuccess({ url: context.url, data: body, code: 200 }, st, context, null);
      });
    }
    abort() { this.gone = true; super.abort(); }
    destroy() { this.gone = true; super.destroy(); }
  };
  return EarlyLoader;
}
async function play(src, auto = true) {
  if (hls) { hls.destroy(); hls = null; }
  await window.__early.hls;
  if (engine() === 'native') v.src = src; else { hls = new Hls({ enableWorker: true, loader: earlyLoader() }); hls.loadSource(src); hls.attachMedia(v); }
  if (auto) v.play().catch(() => { $('status').textContent = 'Tap play to start.'; });
}

${haveReadyWords.toString()}
const hrHold = (h) => Math.min(8, Math.max(3, haveReadyWords(h) * 0.25));
let hrTimer = 0, hrTick = 0;
const words = (t) => String(t || '').split(/\\s+/).filter(Boolean).length;
function startHereHtml(cls) {
  const sh = combo && combo.start_here;
  if (!sh) return '';
  return '<p class="starthere' + (cls ? ' ' + cls : '') + '" id="starthere">Start here: <a href="' + esc(sh.url) + '" target="_blank" rel="noopener" data-start-here>' + esc(sh.title) + ' ↗</a></p>';
}
// Opening a page from Start here stops the countdown: the guide waits for Start.
function holdForStartHere() {
  const a = document.querySelector('#hr [data-start-here]');
  if (a) a.addEventListener('click', () => { clearTimeout(hrTimer); clearInterval(hrTick); const c = $('hrcount'); if (c) c.textContent = ''; if (G.cards.start) G.cards.start.start_here_opened = true; });
}
// On a small screen a long Have ready list can push Start here below the fold: then it moves above the list.
function keepStartHereInView() {
  const el = $('starthere'), card = document.querySelector('#hr .hrcard'), title = $('hrtitle');
  if (!el || !card || !title || el.classList.contains('above')) return false;
  const r = el.getBoundingClientRect(), c = card.getBoundingClientRect();
  if (r.bottom <= Math.min(innerHeight, c.bottom) + 1 && card.scrollHeight <= card.clientHeight + 1) return false;
  el.classList.add('above'); title.parentNode.insertBefore(el, title);
  // still too tall for the video area: the area grows to the card, so the card never scrolls inside itself
  if (card.scrollHeight > card.clientHeight + 1) $('stage').style.minHeight = (card.scrollHeight + 32) + 'px';
  return true;
}
function drawHaveReady(h, opening) {
  const lead = opening && CARDS.start ? cardLine('start', 'lead-in') : '';
  const sh = opening ? startHereHtml() : '';
  const hold = hrHold(h) + (lead ? words(CARDS.start.text) * 0.25 : 0) + (sh ? (2 + words(combo.start_here.title)) * 0.25 : 0);
  const body = h.sections.map((s) => '<h3>' + esc(s.title) + '</h3>' + groupsHtml(s.lines)).join('');
  $('hr').innerHTML = '<div class="hrcard"><span class="badge"><b>GUIDE</b> · before you start</span>' + lead + '<h2 id="hrtitle">' + esc(h.heading) + '</h2>' + body +
    (h.more_text ? '<p class="more">' + esc(h.more_text) + '</p>' : '') + '<p class="close">' + esc(h.closing) + '</p>' + sh +
    '<button class="gbtn" id="hrgo" type="button">' + (opening ? 'Start' : 'Continue') + '</button><p class="count" id="hrcount"></p></div>';
  $('hr').hidden = false; $('stage').classList.add('hr-open');
  G.haveReady = { shown: true, opening, hold_s: hold, sections: h.sections.map((s) => ({ task: s.task, title: s.title, lines: s.lines.map((l) => l.text) })), more: !!h.more, closing: h.closing, closed_by: null };
  requestAnimationFrame(() => { const moved = keepStartHereInView(); if (G.cards.start) G.cards.start.start_here_above = moved; const c = document.querySelector('.hrcard'); if (c && G.haveReady) { G.haveReady.fits = c.scrollHeight <= c.clientHeight + 1; G.haveReady.height = Math.round(c.getBoundingClientRect().height); G.haveReady.items = [...c.querySelectorAll('li')].map((li) => li.textContent); } });
  return hold;
}
function groupsHtml(lines) {
  let out = '', open = false;
  for (const l of lines) {
    if (l.kind === 'lead') { if (open) { out += '</ul>'; open = false; } out += '<p class="lead" data-quoted>' + esc(l.text) + '</p>'; }
    else { if (!open) { out += '<ul>'; open = true; } out += '<li data-quoted>' + esc(l.text) + '</li>'; }
  }
  return out + (open ? '</ul>' : '');
}
function closeHaveReady(by, resume) {
  clearTimeout(hrTimer); clearInterval(hrTick);
  $('hr').hidden = true; $('stage').classList.remove('hr-open'); $('stage').style.minHeight = '';
  if (G.haveReady) G.haveReady.closed_by = by;
  if (G.cards.start && by && !G.cards.start.closed_by) G.cards.start.closed_by = by;
  if ((by === 'button' || by === 'timer') && G.cards.start && combo && combo.have_ready && !G.cards.start.skip_armed) { skipNeed = needClipOfTask1(combo); G.cards.start.skip_armed = true; G.skipNeed = skipNeed; }
  if (resume) v.play().catch(() => { $('status').textContent = 'Tap play to start.'; });
}
function drawStartCard() {
  const sh = startHereHtml();
  $('hr').innerHTML = '<div class="hrcard"><span class="badge"><b>GUIDE</b> · before you start</span>' + cardLine('start', 'lead-in', 'h2') + sh +
    '<button class="gbtn" id="hrgo" type="button">Start</button><p class="count" id="hrcount"></p></div>';
  $('hr').hidden = false; $('stage').classList.add('hr-open');
  return Math.min(8, CARDS.start.hold_s + (sh ? (2 + words(combo.start_here.title)) * 0.25 : 0));
}
const TAP_TO_START = matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');
function openHaveReady(opening) {
  const h = combo && combo.have_ready;
  if (!h && !(opening && (CARDS.start || combo.start_here))) return;
  const wasPlaying = !v.paused && !v.ended;
  if (!opening) v.pause();
  if (opening) G.cards.start = { id: CARDS.start ? CARDS.start.id : null, with_have_ready: !!h, start_here: combo.start_here || null, closed_by: null };
  const hold = h ? drawHaveReady(h, opening) : drawStartCard();
  const tapOnly = opening && TAP_TO_START.matches;
  if (opening) { G.cards.start.hold_s = hold; G.cards.start.auto = !tapOnly; holdForStartHere(); }
  $('hrgo').addEventListener('click', () => closeHaveReady('button', opening || wasPlaying));
  $('hrgo').focus({ preventScroll: true });
  if (opening && !tapOnly) {
    const until = Date.now() + hold * 1000;
    const count = () => { const s = Math.max(0, Math.ceil((until - Date.now()) / 1000)); $('hrcount').textContent = 'Starting in ' + s + ' s'; };
    count(); hrTick = setInterval(count, 250);
    hrTimer = setTimeout(() => closeHaveReady('timer', true), hold * 1000);
  }
}
$('haveready').addEventListener('click', () => { if ($('hr').hidden) openHaveReady(false); });

// The guide's structure from the record: Intro (before the first task's first segment), one part per task (its first
// clip after the intro to its last segment's end), Finish (the rest). A stop sits at each task's last segment end.
function structure(rec) {
  const tl = rec.timeline, n = rec.tasks.length;
  const lastSeg = (t) => tl.filter((x) => x.task === t && x.kind === 'segment').at(-1);
  const firstSeg = tl.find((x) => x.kind === 'segment');
  parts = [{ label: 'Intro', start: 0, end: firstSeg ? firstSeg.start_s : 0 }];
  let at = parts[0].end;
  rec.tasks.forEach((t, k) => {
    const end = lastSeg(t).end_s;
    parts.push({ label: (k + 1) + ' of ' + n + ': ' + rec.titles[t], task: t, k, start: at, end });
    at = end;
  });
  parts.push({ label: 'Finish', start: at, end: rec.total_s });
  stops = rec.tasks.map((t, k) => {
    const seg = lastSeg(t);
    let i = tl.indexOf(seg) + 1;
    while (tl[i] && tl[i].kind === 'card') i++;
    return { task: t, k, at: seg.end_s, resume: tl[i] ? tl[i].start_s : rec.total_s, last: k === n - 1 };
  });
  G.starts = rec.tasks.map((t) => tl.find((x) => x.task === t && x.kind !== 'card').start_s);
  G.stops = stops.map((s) => ({ ...s }));
  $('bar').innerHTML = parts.map((p) => '<div class="part" style="flex-grow:' + Math.max(0.01, p.end - p.start).toFixed(3) + '"><i></i></div>').join('');
}

function check() {
  if (skipNeed && !v.paused && !v.seeking && v.currentTime >= skipNeed.start_s - 0.07) {
    const k = skipNeed; skipNeed = null;
    if (v.currentTime < k.end_s) {
      const rec = { id: k.id, from: v.currentTime, to: k.end_s, wall: performance.now(), resumed_ms: null }; G.skips.push(rec);
      v.currentTime = k.end_s;
      const seen = () => { if (rec.resumed_ms === null) rec.resumed_ms = Math.round(performance.now() - rec.wall); };
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) v.requestVideoFrameCallback((now, meta) => { if (meta.mediaTime >= k.end_s - 0.05) seen(); else v.requestVideoFrameCallback(() => seen()); });
      else v.addEventListener('timeupdate', function f() { if (v.currentTime > k.end_s + 0.05) { seen(); v.removeEventListener('timeupdate', f); } });
      return arm();
    }
  }
  const s = stops[nextStop];
  if (!s || v.paused || pending || v.seeking) return;
  // Well past the stop means a seek jumped over it (not playback reaching it): re-arm the stops ahead instead.
  if (v.currentTime > s.at + 0.6) { nextStop = stops.findIndex((x) => x.at > v.currentTime + 0.05); if (nextStop < 0) nextStop = stops.length; return arm(); }
  if (v.currentTime >= s.at - 0.07) {
    if (s.last || $('pauses').checked) stopAt(s);
    else { nextStop++; if (s.resume > s.at + 0.05) v.currentTime = s.resume; }
  } else arm();
}
function arm() {
  clearTimeout(timer);
  const s = stops[nextStop];
  if (!s || v.paused || pending) return;
  const at = skipNeed ? Math.min(s.at, skipNeed.start_s) : s.at;
  const ms = ((at - 0.07 - v.currentTime) / (v.playbackRate || 1)) * 1000;
  timer = setTimeout(check, Math.max(0, ms - 15));
}
function tick() {
  draw();
  check();
  raf = requestAnimationFrame(tick);
}
// The step (task) the viewer is on: the stop being shown, else the task part the playhead is in (the intro counts as
// step 1, the finish as the last step).
function curTask() {
  if (pending) return pending.k;
  const t = v.currentTime;
  let k = 0;
  for (const p of parts) if (p.task !== undefined && t >= p.start - 0.01) k = p.k;
  return k;
}
// The browser rejects play() when a pause follows at once (Next tapped twice, a stop): expected, not an error.
function playQuiet() { const pr = v.play(); if (pr) pr.catch((e) => { if (!e || e.name !== 'AbortError') $('status').textContent = 'Tap play to start.'; }); }
function goTask(k, why) {
  if (!$('hr').hidden) closeHaveReady(why, false);
  skipNeed = null;
  ov.hidden = true; pending = null; G.ended = false;
  const to = G.starts[k];
  nextStop = k;
  v.currentTime = to;
  G[why].push({ k, to, wall: performance.now() });
  playQuiet(); // a pause right after (a quick tap) interrupts it: not an error
}
let presented = null;
function onFrame(now, meta) { presented = meta.mediaTime; draw(); v.requestVideoFrameCallback(onFrame); }
if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) v.requestVideoFrameCallback(onFrame);
function position() {
  const c = v.currentTime;
  return presented !== null && !v.paused && !v.seeking && Math.abs(presented - c) < 0.5 ? presented : c;
}
let shownPart = -1;
const linkLabel = (task) => 'Open the page for ' + combo.titles[task] + ' on ' + host() + ' (new tab)';
function drawTaskLine(p) {
  const k = p.task !== undefined ? p.k : (p.label === 'Intro' ? 0 : combo.tasks.length - 1);
  const task = combo.tasks[k], url = combo.guide && combo.guide.pages[task] && combo.guide.pages[task].page_url;
  $('plabel').innerHTML = (p.task ? '<b>' + esc(p.label) + '</b>' : '<span>' + esc(p.label) + '</span>') +
    (url ? '<span aria-hidden="true">·</span><a href="' + esc(url) + '" target="_blank" rel="noopener" data-task-link aria-label="' + esc(linkLabel(task)) + '">Open this page ↗</a>' : '');
  G.taskLink = url ? { k, task, url } : null;
}
function draw() {
  if (!parts.length) return;
  const t = position();
  const bars = $('bar').children;
  let cur = parts.length - 1;
  parts.forEach((p, i) => {
    const f = Math.min(1, Math.max(0, (t - p.start) / Math.max(0.001, p.end - p.start)));
    bars[i].firstChild.style.width = (f * 100).toFixed(1) + '%';
    if (t >= p.start && t < p.end) cur = i;
  });
  const p = parts[cur];
  if (cur !== shownPart) { shownPart = cur; drawTaskLine(p); }
  $('next').disabled = G.ended;
  G.drawn = { t, part: cur, fill: Math.min(1, Math.max(0, (t - p.start) / Math.max(0.001, p.end - p.start))) };
  drawHead(t);
}

function stopAt(s) {
  pending = s;
  clearTimeout(timer);
  v.pause();
  G.pauses.push({ task: s.task, planned: s.at, at: v.currentTime, wall: performance.now() });
  if (v.currentTime > s.at - 0.05) v.currentTime = Math.max(0, s.at - 0.05);
  nextStop++;
  showCard(s);
}

function host() { return combo.guide ? combo.guide.host : combo.site; }
function showCard(s) {
  const pg = (combo.guide && combo.guide.pages[s.task]) || {};
  const n = combo.tasks.length, title = combo.titles[s.task];
  const badge = '<span class="badge"><b>GUIDE</b> · unofficial</span>';
  if (!s.last) {
    ov.innerHTML = '<div class="gcard" role="dialog" aria-label="Task done">' + badge +
      '<h2>' + (s.k + 1) + ' of ' + n + ' done: ' + esc(title) + '</h2>' +
      '<p>Do this step on the real site, then come back.</p>' +
      '<button class="gbtn" id="cont">Done? Continue</button>' +
      (pg.page_url ? '<a class="glink" href="' + esc(pg.page_url) + '" target="_blank" rel="noopener">Open this page on ' + esc(host()) + ' ↗</a>' : '') + '</div>';
    ov.hidden = false;
    $('cont').addEventListener('click', () => resume(s));
    $('cont').focus();
  } else {
    const sh = combo.start_here;
    const cta = sh ? '<a class="gbtn" id="endstart" href="' + esc(sh.url) + '" target="_blank" rel="noopener" data-start-here>Start here: ' + esc(sh.title) + ' ↗</a>' : '';
    ov.innerHTML = '<div class="gcard" role="dialog" aria-label="Guide finished">' + badge +
      '<h2>That’s everything in this guide.</h2>' + cardLine('end', 'gempathy') + cta +
      '<button class="gbtn gsecondary" id="again">Watch again</button>' +
      '<button class="gbtn gsecondary" id="endsend" type="button">Send me this plan</button>' +
      '<p class="fine">Unofficial guide. Not affiliated with ' + esc(host()) + '.' + (combo.narrated === false ? '' : ' Narrated with an AI voice.') + '</p></div>';
    ov.hidden = false;
    G.ended = true;
    G.cards.end = { id: CARDS.end ? CARDS.end.id : null, start_here: sh || null };
    $('endsend').addEventListener('click', openSheet);
    $('again').addEventListener('click', () => { skipNeed = null; ov.hidden = true; G.ended = false; pending = null; nextStop = 0; v.currentTime = 0; playQuiet(); });
    const first = ov.querySelector('.gbtn'); if (first) first.focus();
  }
}

function resume(s, how) {
  ov.hidden = true;
  pending = null;
  v.currentTime = s.resume;
  G.resumes.push({ task: s.task, to: s.resume, how: how || 'button', wall: performance.now() });
  playQuiet(); // a pause right after (a quick tap) interrupts it: not an error
}

v.addEventListener('seeked', () => {
  if (skipNeed && v.currentTime > 0.5) skipNeed = null;
  if (!pending) { nextStop = stops.findIndex((s) => s.at > v.currentTime + 0.05); if (nextStop < 0) nextStop = stops.length; }
  arm();
});
// Play while a task's pause is showing (the floating window's own play button, or the video's controls) continues to
// the next step, exactly as "Done? Continue" does.
v.addEventListener('play', () => { if (pending && !pending.last) resume(pending, 'play'); else if (!ov.hidden && !G.ended) ov.hidden = true; arm(); });
v.addEventListener('timeupdate', () => { draw(); check(); });
v.addEventListener('seeked', draw);
v.addEventListener('ratechange', () => { showSpeed(); G.speeds.push(v.playbackRate); arm(); });
v.addEventListener('loadedmetadata', () => applySpeed(pref));
$('replay').addEventListener('click', () => { if (combo) goTask(curTask(), 'replays'); });
$('next').addEventListener('click', () => {
  if (!combo) return;
  const k = curTask();
  if (k + 1 < stops.length) return goTask(k + 1, 'nexts');
  // Last step: straight to the final screen.
  const s = stops[stops.length - 1];
  G.nexts.push({ k: 'finish', to: s.at, wall: performance.now() });
  ov.hidden = true; pending = null; nextStop = stops.length - 1;
  v.currentTime = Math.max(0, s.at - 0.05);
  stopAt(s);
});
$('speed').addEventListener('click', () => {
  const x = Math.abs(v.playbackRate - 1) < 0.001 ? 0.75 : 1;
  pref = x; saveSpeed(x); applySpeed(x); showSpeed();
});
applySpeed(pref); showSpeed();

const names = (site) => Object.fromEntries(((sites[site] && sites[site].tasks) || []).map((t) => [t.id, t.title]));
function drawPlan(rec, clientMs) {
  const p = $('plan');
  p.innerHTML = planCardHtml(rec, sites[rec.site] && sites[rec.site].label, names(rec.site), clientMs);
  p.hidden = false;
  p.querySelectorAll('.ch').forEach((el) => el.addEventListener('click', () => { if (!$('hr').hidden) closeHaveReady('chapter', false); goTask(+el.dataset.k, 'jumps'); }));
  $('send').addEventListener('click', openSheet);
}
function drawAnswer(a, ms) {
  const box = $('answer');
  if (!a) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = answerHtml(a, ms); box.hidden = !box.innerHTML;
  box.querySelectorAll('.chip').forEach((el) => el.addEventListener('click', () => build(combo ? combo.site : $('site').value, combo ? combo.device : $('device').value, [el.dataset.id], true)));
}
function keepHandoff(rec, extra) { try { sessionStorage.setItem('${HANDOFF_KEY}', JSON.stringify({ id: rec.id, rec, answer: extra.answer || null, ms: extra.ms ?? null, clientMs: extra.clientMs ?? null })); } catch (e) { /* storage blocked */ } }
function readHandoff(id) { try { const x = JSON.parse(sessionStorage.getItem('${HANDOFF_KEY}') || 'null'); return x && x.id === id && x.rec ? x : null; } catch (e) { return null; } }
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
function closeSheet() { $('sheet').hidden = true; if ($('send')) $('send').focus(); }
$('sheetdev').addEventListener('change', sheetMessage);
$('closesheet').addEventListener('click', closeSheet);
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });
$('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('msgtext').textContent); $('copy').textContent = 'Copied'; } catch (e) { const r = document.createRange(); r.selectNodeContents($('msgtext')); getSelection().removeAllRanges(); getSelection().addRange(r); $('copy').textContent = 'Selected: copy it'; } });

function start(rec, clientMs) {
  combo = rec;
  drawPlan(rec, clientMs);
  if (rec.guide) { document.documentElement.style.setProperty('--button', rec.guide.button); document.documentElement.style.setProperty('--mark', rec.guide.mark); }
  structure(rec);
  nextStop = 0; pending = null; ov.hidden = true; G.pauses = []; G.resumes = []; G.replays = []; G.nexts = []; G.ended = false;
  cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  history.replaceState(null, '', '/guide?c=' + rec.id);
  $('status').textContent = rec.tasks.length + ' task' + (rec.tasks.length === 1 ? '' : 's') + ', ' + Math.round(rec.total_s) + ' s';
  const t0 = Number(qs.get('t'));
  // "Have ready": shown before a guide that starts from the beginning; the button stays for reopening it.
  shownPart = -1; G.pages = rec.guide ? rec.guide.pages : null;
  closeHaveReady(null, false); G.haveReady = null; G.cards = {}; skipNeed = null; G.skips = []; G.skipNeed = null;
  $('haveready').hidden = !rec.have_ready;
  const opening = (!!rec.have_ready || !!CARDS.start || !!rec.start_here) && !(t0 > 0 && qs.get('c') === rec.id);
  window.__early.prefetch(rec.playlist || '/c/' + rec.id + '.m3u8');
  play(rec.playlist || '/c/' + rec.id + '.m3u8', !opening);
  if (opening) openHaveReady(true);
  G.ready = true;
  if (t0 > 0 && qs.get('c') === rec.id) { const go = () => { v.currentTime = Math.min(t0, rec.total_s - 0.5); }; if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true }); }
  loadMap(rec);
}

const MAP = { colW: 170, rowH: 44, padX: 24, padY: 40 };
let mapState = null;
async function loadMap(rec) {
  mapState = null; mapData = null; $('map').innerHTML = ''; $('vmap').innerHTML = ''; $('vmap').hidden = true;
  const early = window.__early.map ? await window.__early.map : null;
  window.__early.map = null;
  const r = early && early.site === rec.site ? early.r : await fetch('/api/map/' + encodeURIComponent(rec.site));
  if (!r.ok) { $('mapbox').hidden = true; return; }
  const map = await r.json();
  const route = mapRoute(rec, map);
  if (!route.length) { $('mapbox').hidden = true; return; }
  $('mapbox').hidden = false;
  mapData = { map, route };
  drawMap();
}
const PHONE_MAP = matchMedia('(max-width: 767px)');
let mapData = null;
function drawMap() {
  if (!mapData) return;
  const { map, route } = mapData;
  if (PHONE_MAP.matches) return drawLineMap(map, route);
  $('vmap').hidden = true; $('map').style.display = '';
  $('maplegend').textContent = "Large circles are the site's main hub pages; the coloured line is this guide's route; the white dot follows the video.";
  const lay = mapLayout(map, route);
  const pos = {};
  for (const n of lay.nodes) pos[n.id] = { x: MAP.padX + n.x * MAP.colW, y: MAP.padY + n.y * MAP.rowH, n };
  const W = MAP.padX * 2 + (lay.width - 1) * MAP.colW + 150, H = MAP.padY + lay.height * MAP.rowH;
  const svg = $('map');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  // Desktop: shrink to fit the panel, but never below 75% (text stays readable); beyond that it scrolls sideways.
  const cw = svg.parentElement.clientWidth || W;
  const scale = matchMedia('(min-width: 1100px)').matches ? Math.max(0.75, Math.min(1, cw / W)) : 1;
  svg.style.width = Math.round(W * scale) + 'px';
  let h = '';
  if (map.sites) map.sites.forEach((s) => { const p = pos[s.home]; if (p) h += '<text class="lane" x="' + (p.x - 8) + '" y="18">' + esc(s.name) + '</text>'; });
  const seen = new Set();
  for (const st of Object.values(map.steps)) { const a = pos[st.from], b = pos[st.to]; const k = st.from + '>' + st.to; if (a && b && st.from !== st.to && !seen.has(k)) { seen.add(k); h += '<line class="edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; } }
  route.forEach((r, i) => {
    const a = pos[r.from], b = pos[r.to];
    if (a && b && r.from !== r.to) h += '<line class="route" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    const nx = route[i + 1];
    if (nx && nx.from !== r.to && pos[r.to] && pos[nx.from]) h += '<line class="jump" x1="' + pos[r.to].x + '" y1="' + pos[r.to].y + '" x2="' + pos[nx.from].x + '" y2="' + pos[nx.from].y + '"/>';
  });
  for (const p of Object.values(pos)) {
    const short = p.n.title.length > 22 ? p.n.title.slice(0, 21) + '…' : p.n.title;
    h += '<g><title>' + esc(p.n.title) + '</title><circle class="node' + (p.n.hub ? ' hub' : '') + (p.n.onRoute ? ' on' : '') + '" cx="' + p.x + '" cy="' + p.y + '" r="' + (p.n.hub ? 9 : 6) + '"/>' +
      '<text x="' + (p.x + 13) + '" y="' + (p.y + 4) + '">' + esc(short) + '</text></g>';
  }
  h += '<circle class="head" id="mhead" r="7" cx="-20" cy="-20"/>';
  svg.innerHTML = h;
  mapState = { route, pos, scale, W };
  drawHead(position());
}
function drawLineMap(map, route) {
  const line = mapLine(route), node = Object.fromEntries(map.nodes.map((n) => [n.id, n]));
  const siteName = Object.fromEntries((map.sites || []).map((x) => [x.site, x.name]));
  let h = '', lastSite = null;
  line.stops.forEach((id, i) => {
    const n = node[id] || { title: id }, site = n.site || null;
    if (map.sites && site && site !== lastSite && i > 0) h += '<li class="site" aria-hidden="true">' + esc('On ' + (siteName[site] || site)) + '</li>';
    lastSite = site || lastSite;
    h += '<li class="stop' + (line.jumps.includes(i) && !(map.sites && site && i > 0 && site !== node[line.stops[i - 1]]?.site) ? ' jump' : '') + '" data-i="' + i + '"><span class="vdot' + (n.hub ? ' hub' : '') + '" aria-hidden="true"></span><span class="vlabel">' + esc(n.title) + '</span></li>';
  });
  $('map').style.display = 'none';
  const ol = $('vmap'); ol.innerHTML = h + '<span class="vhead" id="vhead" aria-hidden="true"></span>'; ol.hidden = false;
  $('maplegend').textContent = "Large circles are the site's main hub pages; the line is this guide's route, top to bottom; the white dot follows the video.";
  mapState = { kind: 'line', line, stops: [...ol.querySelectorAll('li.stop')] };
  drawHead(position());
}
PHONE_MAP.addEventListener('change', drawMap);
function markChapter(t) { document.querySelectorAll('#plan .ch').forEach((el) => el.classList.toggle('on', t >= +el.dataset.s && t < +el.dataset.e)); }
function drawHead(t) {
  markChapter(t);
  if (!mapState) return;
  if (mapState.kind === 'line') {
    const p = mapLinePosition(mapState.line, t);
    if (p === null) return;
    const lis = mapState.stops, i = Math.min(lis.length - 1, Math.floor(p)), j = Math.min(lis.length - 1, i + 1), fr = p - i;
    const c = (li) => li.offsetTop + li.offsetHeight / 2;
    const y = c(lis[i]) + (c(lis[j]) - c(lis[i])) * fr;
    $('vhead').style.top = (y - 10).toFixed(1) + 'px';
    G.mapHead = { line: true, at: +p.toFixed(3), y: Math.round(y) };
    return;
  }
  const p = mapPosition(mapState.route, t);
  if (!p) return;
  let x, y;
  if (p.at) { const a = mapState.pos[p.at]; if (!a) return; x = a.x; y = a.y; }
  else { const a = mapState.pos[p.from], b = mapState.pos[p.to]; if (!a || !b) return; x = a.x + (b.x - a.x) * p.frac; y = a.y + (b.y - a.y) * p.frac; }
  const c = $('mhead'); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
  // Keep the playhead in view when the map is wider than its panel (scrolls sideways only when it leaves the view).
  const wrap = $('map').parentElement, px = x * mapState.scale;
  if (px < wrap.scrollLeft + 24 || px > wrap.scrollLeft + wrap.clientWidth - 24) wrap.scrollLeft = Math.max(0, px - wrap.clientWidth / 3);
  G.mapHead = { x: +x.toFixed(1), y: +y.toFixed(1), ...p };
}
if (matchMedia('(min-width: 1100px), (max-width: 767px)').matches) $('mapbox').open = true;

async function build(site, device, tasks, fromAnswer) {
  const t = performance.now();
  const r = await fetch('/api/plan?site=' + encodeURIComponent(site) + '&device=' + device + '&tasks=' + tasks.join(','));
  const b = await r.json();
  if (!r.ok) { $('status').textContent = 'Cannot build: ' + b.error; return; }
  const ms = performance.now() - t;
  if (!fromAnswer) drawAnswer(null);
  keepHandoff(b, { clientMs: ms });
  start(b, ms);
}
function drawTasks() {
  const s = sites[$('site').value];
  $('tasks').innerHTML = s.tasks.map((t) => '<label><input type="checkbox" value="' + esc(t.id) + '"> ' + esc(t.title) + '</label>').join('');
}

(async () => {
  const s0 = await window.__early.sites;
  sites = (s0.ok ? s0.j : await (await fetch('/api/sites')).json()).sites;
  const offered = Object.entries(sites).filter(([id, s]) => !s.in_group || qs.get('site') === id);
  $('site').innerHTML = offered.map(([id, s]) => '<option value="' + esc(id) + '">' + esc(s.label || id) + '</option>').join('');
  $('site').addEventListener('change', drawTasks);
  if (qs.get('site') && sites[qs.get('site')]) $('site').value = qs.get('site');
  $('device').value = qs.get('device') || (matchMedia('(min-width: 900px)').matches ? 'desktop' : 'mobile');
  drawTasks();
  $('go').addEventListener('click', () => build($('site').value, $('device').value, [...document.querySelectorAll('#tasks input:checked')].map((i) => i.value)));
  const ho = qs.get('c') ? readHandoff(qs.get('c')) : null;
  if (ho) { start(ho.rec, ho.clientMs); drawAnswer(ho.answer, ho.ms); }
  else if (qs.get('c')) {
    const c0 = await window.__early.combo;
    if (c0 && c0.ok) start(c0.j); else $('status').textContent = 'No guide ' + qs.get('c');
  } else if (qs.get('tasks')) build($('site').value, $('device').value, qs.get('tasks').split(','));
  else $('pick').open = true;
})();
</script>
</body>
</html>`;

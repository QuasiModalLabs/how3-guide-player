// Makes the demo's placeholder video: one short title card per clip in demo/clips.mjs, for phone (540x960) and
// computer (960x540), cut into 2-second fMP4 HLS segments. Writes demo/media/<device>/<clip>/ and demo/media/clips.json.
// The output is committed, so you only need this after changing the fixture. Needs ffmpeg on PATH and a TrueType font:
//   npm run make:video                     (looks for Arial, Helvetica or DejaVu Sans)
//   npm run make:video -- --font path/to/font.ttf
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { clipList, DEMO_DIR, DEVICES, SITE } from '../demo/clips.mjs';

const MEDIA = path.join(DEMO_DIR, 'media');
const TMP = path.join(MEDIA, '.tmp');
const FPS = 30;

const FONTS = [
  'C:/Windows/Fonts/arial.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf', '/Library/Fonts/Arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/TTF/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf',
];
const arg = process.argv.indexOf('--font');
const font = arg > 0 ? process.argv[arg + 1] : FONTS.find((f) => existsSync(f));
if (!font || !existsSync(font)) {
  console.error('No TrueType font found. Pass one with: npm run make:video -- --font path/to/font.ttf');
  process.exit(1);
}
const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (probe.status !== 0) { console.error('ffmpeg is not on PATH.'); process.exit(1); }

/** Splits text into lines of at most max characters, at spaces. */
function wrap(text, max) {
  const out = []; let line = '';
  for (const w of text.split(/\s+/)) {
    if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

const LOOK = {
  card: { bg: '0x16181d', fg: 'white', sub: '0xc9ced6' },
  return: { bg: '0x16181d', fg: 'white', sub: '0xc9ced6' },
  segment: { bg: '0xf4f5f7', fg: '0x14171c', sub: '0x14171c' },
};

function filters(clip, size, dir) {
  const { width: W, height: H } = size;
  const look = LOOK[clip.kind];
  const big = Math.round(Math.min(W, H) * 0.075), small = Math.round(big * 0.62);
  const maxBig = Math.floor((W * 0.86) / (big * 0.55)), maxSmall = Math.floor((W * 0.86) / (small * 0.52));
  const f = [];
  let n = 0;
  const text = (s, size, color, y) => {
    const file = path.join(TMP, `t${n++}.txt`);
    writeFileSync(file, s);
    const rel = path.relative(dir, file).split(path.sep).join('/');
    const fontRel = path.relative(dir, path.join(TMP, 'font.ttf')).split(path.sep).join('/');
    f.push(`drawtext=fontfile=${fontRel}:textfile=${rel}:expansion=none:fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${Math.round(y)}`);
  };
  const [head, ...rest] = clip.lines;
  const headLines = wrap(head, maxBig), restLines = rest.flatMap((l) => wrap(l, maxSmall).concat(['']));
  restLines.pop();
  const blockH = headLines.length * big * 1.25 + small + restLines.length * small * 1.45;
  let y = (H - blockH) / 2;
  if (clip.kind === 'segment') {
    const bar = Math.round(H * 0.11);
    f.push(`drawbox=x=0:y=0:w=${W}:h=${bar}:color=0x1d3b5c:t=fill`);
    text(SITE.label.replace(' (demo)', ''), small, 'white', (bar - small) / 2);
    y = Math.max(y, bar + small);
  }
  for (const l of headLines) { text(l, big, look.fg, y); y += big * 1.25; }
  y += small;
  if (clip.kind === 'segment' && restLines.length) {
    const boxH = Math.round(small * 2.4), boxW = Math.round(W * 0.8);
    f.push(`drawbox=x=${Math.round((W - boxW) / 2)}:y=${Math.round(y - small * 0.7)}:w=${boxW}:h=${boxH}:color=0xffdd00:t=6`);
  }
  for (const l of restLines) { if (l) text(l, small, look.sub, y); y += small * 1.45; }
  // near the top, clear of the player's controls at the bottom
  const note = Math.round(small * 0.75), top = clip.kind === 'segment' ? Math.round(H * 0.11) + note * 0.8 : note * 1.6;
  text('Placeholder video. Not a real website.', note, clip.kind === 'segment' ? '0x5b6370' : '0x9aa3ae', top);
  return f.join(',');
}

function render(clip, device, size) {
  const dir = path.join(MEDIA, device, clip.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const vf = filters(clip, size, dir);
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', `color=c=${LOOK[clip.kind].bg}:s=${size.width}x${size.height}:r=${FPS}:d=${clip.seconds}`,
    '-vf', vf, '-an', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'stillimage', '-crf', '30', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-g', String(FPS * 2), '-keyint_min', String(FPS * 2), '-sc_threshold', '0',
    '-f', 'hls', '-hls_time', '2', '-hls_playlist_type', 'vod', '-hls_segment_type', 'fmp4',
    '-hls_fmp4_init_filename', 'init.mp4', '-hls_segment_filename', 'seg_%03d.m4s', 'index.m3u8',
  ];
  const r = spawnSync('ffmpeg', args, { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${device}/${clip.id}: ${r.stderr}`);
  const m3u8 = readFileSync(path.join(dir, 'index.m3u8'), 'utf8');
  const segments = [];
  const lines = m3u8.split(/\r?\n/);
  lines.forEach((l, i) => { const m = l.match(/^#EXTINF:([\d.]+)/); if (m) segments.push({ file: lines[i + 1].trim(), seconds: Number(m[1]) }); });
  const total = +segments.reduce((a, s) => a + s.seconds, 0).toFixed(3);
  if (Math.abs(total - clip.seconds) > 0.02) throw new Error(`${device}/${clip.id}: ${total} s, expected ${clip.seconds} s`);
  return { seconds: total, segments };
}

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
copyFileSync(font, path.join(TMP, 'font.ttf'));
const out = {};
for (const [device, size] of Object.entries(DEVICES)) {
  out[device] = {};
  for (const clip of clipList()) out[device][clip.id] = render(clip, device, size);
  console.log(`${device}: ${Object.keys(out[device]).length} clips`);
}
for (const d of readdirSync(MEDIA)) if (!(d in DEVICES) && d !== '.tmp' && d !== 'clips.json') rmSync(path.join(MEDIA, d), { recursive: true, force: true });
rmSync(TMP, { recursive: true, force: true });
writeFileSync(path.join(MEDIA, 'clips.json'), JSON.stringify(out, null, 1) + '\n');
console.log('Wrote demo/media/clips.json');

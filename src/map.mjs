// The route map's pure functions: the guide's route, the playhead position, the desktop layout and the phone's
// top-to-bottom line. The player inlines them with toString(), and the unit tests import them.

/** The guide's route: its steps in timeline order, as edges { id, from, to, kind, start, end }. */
export function mapRoute(rec, map) {
  return rec.timeline.filter((x) => map.steps[x.id]).map((x) => ({ id: x.id, ...map.steps[x.id], start: x.start_s, end: x.end_s }));
}

/** Where the playhead is at media time t: on an edge { from, to, frac } during a step, else resting { at } on the
 *  page of the last step that ended (before any step: where the first step starts). */
export function mapPosition(route, t) {
  if (!route.length) return null;
  let at = route[0].from;
  for (const r of route) {
    if (t < r.start) break;
    if (t < r.end) return { from: r.from, to: r.to, frac: Math.max(0, Math.min(1, (t - r.start) / Math.max(0.001, r.end - r.start))) };
    at = r.to;
  }
  return { at };
}

/** The sub-graph to draw: homepage(s), hubs and every page on the route, laid out in columns by depth (one lane per
 *  site for a group). Returns { nodes: [{id, title, hub, onRoute, x, y}], width, height } in abstract units. */
export function mapLayout(map, route) {
  const onRoute = new Set(route.flatMap((r) => [r.from, r.to]));
  const homes = new Set(map.sites ? map.sites.map((s) => s.home) : [map.home]);
  const keep = map.nodes.filter((n) => n.hub || onRoute.has(n.id) || homes.has(n.id));
  const lanes = map.sites ? map.sites.map((s) => s.site) : [null];
  const out = []; let x0 = 0; let height = 0;
  for (const lane of lanes) {
    const ns = keep.filter((n) => (lane ? n.site === lane : true));
    const cols = {};
    for (const n of ns) (cols[Math.min(n.depth, 6)] ??= []).push(n);
    const depths = Object.keys(cols).map(Number).sort((a, b) => a - b);
    depths.forEach((d, ci) => {
      cols[d].sort((a, b) => (onRoute.has(b.id) - onRoute.has(a.id)) || a.title.localeCompare(b.title));
      cols[d].forEach((n, ri) => { out.push({ id: n.id, title: n.title, hub: n.hub, onRoute: onRoute.has(n.id), x: x0 + ci, y: ri, lane }); height = Math.max(height, ri + 1); });
    });
    x0 += depths.length + (lane ? 0.6 : 0);
  }
  return { nodes: out, width: Math.max(1, x0), height: Math.max(1, height) };
}

export function mapLine(route) {
  const stops = [], edges = [], jumps = [];
  const add = (id) => { if (stops[stops.length - 1] !== id) stops.push(id); return stops.length - 1; };
  for (const r of route) {
    if (stops.length && stops[stops.length - 1] !== r.from) jumps.push(stops.length);
    const fromIdx = add(r.from), toIdx = add(r.to);
    edges.push({ fromIdx, toIdx, start: r.start, end: r.end });
  }
  return { stops, edges, jumps };
}

export function mapLinePosition(line, t) {
  if (!line.edges.length) return null;
  let at = line.edges[0].fromIdx;
  for (const e of line.edges) {
    if (t < e.start) break;
    if (t < e.end) return e.fromIdx + (e.toIdx - e.fromIdx) * Math.max(0, Math.min(1, (t - e.start) / Math.max(0.001, e.end - e.start)));
    at = e.toIdx;
  }
  return at;
}

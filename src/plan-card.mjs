// The plan card and the finder's answer, shared by the main page and the player. Each function is self-contained,
// so the pages can inline it with toString() and the unit tests can import it.

export function planCardHtml(rec, siteLabel, names, clientMs) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const mins = (s) => { const m = Math.floor(s / 60), r = Math.round(s % 60); return (m ? m + ' min' : '') + (r || !m ? (m ? ' ' : '') + r + ' s' : ''); };
  const WHY = { stage: 'check eligibility before acting', rule: 'the order the official guidance requires', requires: 'needed before the next step', stated: 'the order you asked for', tie: 'either order works; this one is shortest' };
  const title = (id) => (id && ((rec.titles && rec.titles[id]) || (names && names[id]))) || null;
  const tasks = rec.tasks || [], inGuide = new Set(tasks);
  const why = (rec.reasons || []).filter((r) => r && inGuide.has(r.before) && inGuide.has(r.after) && title(r.before) && title(r.after));
  const stats = rec.stats || {};
  const budget = Number.isFinite(stats.budget_s) ? ' of the ' + mins(stats.budget_s) + ' limit' : '';
  const returns = (rec.returns || []).filter((r) => title(r.after_task) && title(r.before_task));
  const nRet = Number.isFinite(stats.returns) ? stats.returns : returns.filter((r) => r.id).length;
  let h = '<div class="muted">Guide <code>' + esc(rec.id) + '</code> · ' + esc(siteLabel || rec.site) + ' · ' + (rec.device === 'desktop' ? 'on a computer' : 'on a phone') + ' · ' + mins(rec.total_s) + ' · ' + (rec.items || []).length + ' clips' +
    (clientMs != null && Number.isFinite(clientMs) ? ' · built in ' + clientMs.toFixed(0) + ' ms' : '') + '</div>';
  h += '<b>Chapters</b><ol>' + (rec.chapters || []).map((c, k) => '<li class="ch" data-k="' + k + '" data-s="' + c.start_s + '" data-e="' + c.end_s + '">' + esc(c.title) + ' <span class="muted">' + clock(c.start_s) + '</span></li>').join('') + '</ol>';
  if (rec.also_needed && rec.also_needed.length) {
    const sep = rec.also_needed.filter((a) => a.why === 'separate_site'), over = rec.also_needed.filter((a) => a.why !== 'separate_site');
    const li = (a) => '<li>' + esc(a.title) + ' · <a href="' + esc(a.guide) + '">its own guide</a></li>';
    h += '<b>Also needed</b> ';
    if (over.length) h += '<span class="muted">(these did not fit in the ' + mins(stats.budget_s) + ' limit)</span><ul>' + over.map(li).join('') + '</ul>';
    if (sep.length) h += '<span class="muted">(on another website: each has its own guide for now)</span><ul>' + sep.map(li).join('') + '</ul>';
  }
  if (tasks.length === 1) h += '<b>Why this order</b><ul><li>This guide has one task.</li></ul>';
  else if (why.length) h += '<b>Why this order</b><ul>' + why.map((r) => '<li>' + esc(title(r.before)) + ' before ' + esc(title(r.after)) + ': ' + esc(WHY[r.type] || 'the usual order') + '</li>').join('') + '</ul>';
  h += '<b>Between tasks</b><ul>' + (returns.map((r) => '<li>From ' + esc(title(r.after_task)) + ' to ' + esc(title(r.before_task)) + ': ' + (r.id ? r.clicks + ' click' + (r.clicks === 1 ? '' : 's') + ' back through the site (' + esc(String(r.via).split('+').join(', ')) + ')' : 'it carries on from the same page') + '</li>').join('') || '<li>This guide has one task.</li>') + '</ul>';
  h += '<div class="muted">' + (rec.segments || []).length + ' filmed steps, ' + nRet + ' way' + (nRet === 1 ? '' : 's') + ' back between tasks, ' + mins(rec.total_s) + budget + '</div>';
  h += '<div class="row" style="margin-top:12px"><button id="send" type="button">Send me this plan</button></div>';
  return h;
}

export function answerHtml(b, ms) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let h = '';
  if (b.tasks && b.tasks.length) h += '<div class="understood"><span class="ut">' + (b.cached ? 'Understood (cached)' : 'Understood in ' + ((ms || 0) / 1000).toFixed(1) + ' s') + '</span>Understood as: ' + b.tasks.map((x) => esc(x.title)).join(', ') + '</div>';
  for (const u of b.uncovered || []) {
    h += (u.kind === 'unclear' ? 'Did you mean? ' : 'No guide for "' + esc(u.phrase) + '" yet. ') +
      (u.chips || []).map((c) => '<button class="chip" data-id="' + esc(c.id) + '">' + esc(c.title) + '</button>').join(' ') + '<br>';
  }
  if (!(b.tasks && b.tasks.length) || (b.uncovered && b.uncovered.length)) h += '<a href="' + esc(b.official_url) + '" rel="noopener">Official site</a>';
  return h;
}

export const HANDOFF_KEY = 'how3.handoff';

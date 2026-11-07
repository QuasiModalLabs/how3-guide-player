# API the pages read

The pages in `src/` talk to a small JSON API. In this repo `demo/server.mjs` answers it from the fixture in `demo/fixtures/`. On the live site a private service answers it from the filmed clips. The shapes are the same in both.

| Request | Answer |
|---|---|
| `GET /api/sites` | The sites you can pick, with their tasks |
| `GET /api/plan?site=&device=&tasks=a,b` | Builds a guide: a **guide record** |
| `GET /api/combo/<id>` | A guide record that has already been built |
| `GET /c/<id>.m3u8` | The guide's video, as an HLS playlist |
| `GET /api/map/<site>` | The site map the route is drawn on |
| `POST /api/match` `{site, device, request}` | The finder: which tasks the words mean, plus a guide record |
| `GET /follow-through/<id>` and `.txt` | The plan as a page, and as a plain-text message |

`device` is `mobile` or `desktop`. A guide id is 12 hex characters.

## Guide record

```jsonc
{
  "id": "3f0c…", "site": "example-council", "device": "mobile",
  "tasks": ["bin-day", "library-card"],                 // in the order the guide plays them
  "titles": { "bin-day": "Check your bin collection day" },
  "total_s": 35,
  "timeline": [                                         // every clip, back to back
    { "id": "card-bin-day-intro", "kind": "card", "role": "intro", "task": "bin-day", "start_s": 0, "end_s": 3 },
    { "id": "seg-bin-day-1", "kind": "segment", "role": null, "task": "bin-day", "start_s": 3, "end_s": 7 },
    { "id": "ret-bin-day", "kind": "return", "role": "return", "task": "library-card", "start_s": 11, "end_s": 14 },
    { "id": "card-end", "kind": "card", "role": "end", "task": "library-card", "start_s": 32, "end_s": 35 }
  ],
  "chapters": [{ "task": "bin-day", "title": "…", "start_s": 0, "end_s": 11 }],
  "reasons": [{ "type": "stage", "before": "bin-day", "after": "library-card" }],    // Why this order
  "returns": [{ "after_task": "bin-day", "before_task": "library-card", "id": "ret-bin-day", "via": "menu", "clicks": 1 }],
  "also_needed": [{ "id": "…", "title": "…", "guide": "/guide?…", "why": "over_budget" }],
  "have_ready": { "heading": "Have ready", "sections": [{ "task": "…", "title": "…", "lines": [{ "kind": "item", "text": "a photo ID" }] }],
                  "more": false, "more_text": null, "closing": "Full details on each official page.", "all_items": ["…"] },
  "start_here": { "task": "bin-day", "url": "https://…", "title": "…" },
  "guide": { "host": "example.org", "button": "#1d6eb7", "mark": "#1d6eb7", "pages": { "bin-day": { "page_url": "https://…" } } },
  "stats": { "returns": 1, "total_s": 35, "budget_s": 300, "max_tasks": 3, "over_budget": false },
  "items": [], "segments": [], "playlist": "/c/3f0c….m3u8", "narrated": false
}
```

How the player uses it:

- **Pause after each task.** The player stops at the end of each task's last `segment`. Continue skips any `card` straight after it.
- **Replay this step and Next step.** These jump to each task's first clip that isn't a card.
- **Progress bar.** It has one part per task, plus Intro and Finish.
- **Start screen.** It shows `have_ready` and `start_here`. A `need` card for task 1 (the video's own "You'll need" clip) is skipped once after the start screen.
- **Route map.** It draws the timeline clips that appear in `steps` of `/api/map`.
- **Plan card.** It shows `chapters`, `reasons`, `returns` and `also_needed`.

## Site map

```jsonc
{ "home": "/",
  "nodes": [{ "id": "/bins", "title": "Bins and recycling", "hub": true, "depth": 1 }],
  "steps": { "seg-bin-day-1": { "from": "/", "to": "/bins", "kind": "segment" } } }
```

## Finder answer

```jsonc
{ "status": "ok", "cached": false,
  "tasks": [{ "id": "bin-day", "title": "…" }],
  "uncovered": [{ "kind": "unclear", "phrase": "…", "chips": [{ "id": "…", "title": "…" }] }],
  "official_url": "https://example.org",
  "plan": { /* a guide record, when any task matched */ } }
```

Other `status` values the page handles: `rate_limited` and `fallback` (the finder is unavailable, so the page falls back to picking tasks).

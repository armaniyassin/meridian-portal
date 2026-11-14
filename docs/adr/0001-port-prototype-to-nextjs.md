# ADR-0001: Port the Meridian prototype into the Next.js app

**Status:** Accepted
**Date:** 2026-11-14
**Deciders:** Product owner (CEO), engineering

## Context
The prototype (`src/`, `dist/index.html`) is the approved design: vanilla JS, hash router, canvas globe, light and dark themes, no backend. The real product is the Next.js 16 App Router app in `web/`, with a cached FRED/FMP data layer that already works. The prototype's hash router broke inside sandboxed viewers, and it cannot hold API keys or call providers.

## Decision
Keep the prototype as the visual reference and port it page by page into `web/`:
1. **Routing:** real routes (`/markets`, `/sentiment`, `/academy`, `/news`, `/brief`) with `next/link`. No hash router.
2. **Design tokens:** the prototype's CSS variables (`--bg`, `--surface`, `--accent`, `--up`, `--down`) become the single source of truth in `globals.css`, exposed to Tailwind as named colors (`bg-surface`, `text-muted`, `text-up`). Light and dark themes switch with `data-theme`, set before first paint to avoid a flash.
3. **Server by default:** pages and data fetching are Server Components. Only interactive pieces are client components: the globe stage, theme toggle and the More menu.
4. **Globe:** the canvas `Globe` class is ported as-is (`lib/globe/globe.ts`, type-checking disabled for that file only) and loaded with a dynamic import inside `useEffect`, so it never runs on the server and stays out of the first JS bundle.
5. **Data flow:** the home and Markets pages read through `lib/markets.ts` → `getOrFetch` (Supabase cache). Failed symbols are shown honestly, never estimated.
6. **Copy:** user-facing errors are plain language. Technical detail (HTTP codes, symbols) shows only in development.

## Options considered
| Option | Complexity | Notes |
|---|---|---|
| A. Port prototype into Next.js (chosen) | Medium | Keeps approved design, adds real backend, one codebase |
| B. Keep prototype and bolt on a separate API | Low now, high later | Two codebases, keys still need a server, hash routing issues remain |
| C. Redesign in Tailwind defaults | Medium | Loses the approved look, no gain |

## Trade-offs
- Palette differs from the older `CLAUDE.md` (slate-950 base). The prototype palette is newer and approved; `CLAUDE.md` should be updated to match.
- The globe file is plain JS under `@ts-nocheck`. Fast and faithful now; rewrite with types later if it needs changes.

## Consequences
- Easier: real data on every page, SEO via Server Components, shareable URLs.
- Harder: every prototype page needs a port; client components must be kept small.
- Revisit: globe typing, heatmap on real data, Tailwind v4 once Node 20.19+ is standard.

## Action items
1. [x] Skeleton, cached data layer, Markets data
2. [ ] Tokens, header, theme toggle, home hero with globe (this change)
3. [ ] Markets tabs and heatmap on real data
4. [ ] Sentiment, Academy, News, brief form
5. [ ] Auth, quota, legal pages, Stripe

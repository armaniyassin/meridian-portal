# HANDOFF: Meridian Global Macro (14 Nov 2026)

Published artifact: slug `440800c7-8905-4877-a1cf-e85d7cf75d0e`, version `1794615972-822f`.

## State
Front-end prototype only: single HTML, vanilla JS/CSS, hash router. No APIs connected, no backend.

Working: header (hides on scroll down, returns on scroll up; no clock), hero with interactive dotted globe (11 hubs, open/closed from exchange hours, day/night), trust accordion, tips carousel (11 visual cards), Finviz-style heatmap (home section + Markets tab), how-it-works diagram, four doors, brief form (preview only, GDPR consent), Markets (sessions chart from published hours, bonds/FX/indices tables with "—"), Sentiment (5 free reports, "Awaiting engine"), Academy (levels + quiz), News landing + article pages (labelled explainers until a feed exists), tip popup (~60 s) and news popup (deep scroll), both auto-close after 20 s, light/dark soft palette, Inter Tight everywhere.

## Integration points (nothing connected yet)
- `PortalData.set(hubId, {idx, bond, fx, ts})`, hubs: nyc tor sao lon fra mad mum hkg sha tyo syd. Heatmap expects `{chg, w}`.
- `PortalData.setNews(items)`.
- Planned sources (labelled in UI): FRED (DGS2, DGS10, VIXCLS), FMP, Finnhub, cached in Supabase.

## Known issues / unverified
- Light theme not re-checked after palette change; home heatmap section and mobile (<700 px) not screenshotted.
- Tip popup also appears on News/article pages.
- Quotes on News page need a human check before launch.
- Exchange hours ignore holidays.

## Next steps
1. QA of the items above.
2. Port to the official stack: Next.js (App Router) + TypeScript + Tailwind, per-department components, Supabase cache for every API call, Resend newsletter with pg_cron, Claude Haiku sentiment, auto-delete news older than 2 weeks.

## Rules to keep
Never invent market data or news. English site. One font family. No clock/hour anywhere. No round surroundings in the header. "Inspired by CFA-level curriculum" only, never the CFA mark.

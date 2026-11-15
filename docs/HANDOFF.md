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

## Globe layers (15 Nov 2026)
Hover control (bottom-right of the home globe, faint until hover/focus) with three opt-in switches: Satellites, Internet cables (long-haul systems highlighted), Air traffic. Code: `src/segments/seg_layers.js`; hooks in `Globe.frame`, `PortalData.setSatellites/setCables/setAircraft`.
- Nothing is requested until a switch is turned on. Failures show the last real snapshot with its UTC time, or "Unavailable right now". No placeholder data.
- Sources: CelesTrak GP (satellites; positions computed from mean elements, approximate), TeleGeography cable map (cables; "highlighted" = systems of 6,000 km or more on the map geometry), OpenSky Network (aircraft; dead-reckoned between 120 s refreshes).
- Feeds go through `server.mjs` (same-origin `/api/satellites|cables|aircraft`, cached on disk, serves the last real snapshot flagged stale if upstream fails). Checked from a real browser: CelesTrak answers with CORS; OpenSky and TeleGeography send NO CORS headers, so a direct browser call is impossible. Response shapes of cables/aircraft are still untested against the live feeds (sandbox had no access); run `node server.mjs` and check the console on first use.
- Before launch (Dept 06/07): TeleGeography data is CC BY-NC-SA (commercial use needs their data licence); OpenSky is non-commercial unless licensed and anonymous access is 400 credits/day (a global call costs 4); CelesTrak asks for one download per 2 h update cycle. Move all three behind our own Supabase-cached route and point `LAYER_SOURCES[*].url` at it.

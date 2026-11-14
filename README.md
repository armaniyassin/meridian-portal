# Meridian Global Macro: front-end prototype

Portal Fintech prototype (markets, bonds, FX, indices, AI sentiment, CFA-inspired academy, weekly brief, news).
Single self-contained HTML (vanilla JS/CSS, Inter Tight + Geist Mono from Google Fonts). **No backend, no live data.**

## Run
```
python3 build.py        # writes dist/index.html
open dist/index.html    # or double-click it
```
Layout: `src/template.html` (markup + CSS, with //@@HUBS@@ //@@TIME@@ //@@GEO@@ //@@APP@@ placeholders), `src/app.js` (router, home globe, pages, popups, heatmap), `src/segments/` (hubs, exchange hours, land polygons + Globe class).

## Golden rules (from the project's CLAUDE.md)
Never invent prices, yields, ratios or news: show "—" until a real feed (FRED, FMP, Finnhub, cached in Supabase) provides them.

## Data adapter (the only integration point)
```js
PortalData.set('lon', { idx:{chg:0.42,w:1}, bond:{chg:-0.03}, fx:{chg:0.10} }); // hubs: nyc tor sao lon fra mad mum hkg sha tyo syd
PortalData.setNews([{ title, url, category }]);
PortalData.setStocks([{ t:'AAPL', chg:1.1 }]);              // daily % per ticker
PortalData.setMacro({ dgs2, dgs10 });                       // US yields, %
PortalData.setCurrencies([{ c:'DXY', chg:0.1 }, { c:'EUR', chg:-0.2 }]); // daily % vs USD
PortalData.setOptions({ pcr, ts, by:{ indices:{pcr}, stocks:{pcr}, bonds:{pcr}, fx:{pcr} } }); // put/call ratio; <0.70 bullish, >1.00 bearish
```
Heatmap reads `store[hub].idx|fx|bond` as `{chg, w}` (daily % and optional market-cap weight).

## Status / next steps
See `docs/HANDOFF.md`. Target stack per project spec: Next.js (App Router) + TypeScript + Tailwind + Supabase + Resend + Claude Haiku; this prototype is to be ported.

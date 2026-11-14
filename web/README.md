# Meridian web (Next.js)

Real product. The design reference is the prototype in the repo root (`src/`, `dist/`).

## Run
1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. `cp .env.example .env.local` and fill in the keys (never commit it).
3. `npm install && npm run dev`, then open /markets.

## Rules
Never invent data. Every external call goes through `lib/cache.ts` `getOrFetch`. All keys stay server-side.

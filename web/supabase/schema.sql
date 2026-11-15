-- Run in the Supabase SQL editor. Cache for every external API call.
create table if not exists api_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table api_cache enable row level security; -- no policies: only the service role can touch it
-- Daily purge of expired rows (requires pg_cron extension).
-- select cron.schedule('purge-api-cache', '15 3 * * *', $$delete from api_cache where expires_at < now() - interval '7 days'$$);

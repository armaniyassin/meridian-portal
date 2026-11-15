-- Accounts, watchlist, saved articles and public Q&A. Run after schema.sql in the Supabase SQL editor.
-- Free limits (5 tickers, 10 saved articles) are enforced in the database, so no client can bypass them.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  level int not null default 1 check (level between 1 and 3),   -- drives the weekly brief
  created_at timestamptz not null default now()
);
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id) values (new.id) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table if not exists watchlist (
  user_id uuid not null references auth.users on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-^=]{1,12}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);
create table if not exists saved_articles (
  user_id uuid not null references auth.users on delete cascade,
  article_id text not null check (length(article_id) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
-- Alerts on an indicator or ticker; evaluated by a pg_cron job that reads api_cache only (never calls an API per user).
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  target_type text not null check (target_type in ('ticker','indicator')),
  target_slug text not null,
  condition text not null check (condition in ('above','below','changes')),
  threshold numeric,
  active boolean not null default true,
  last_triggered_at timestamptz,
  last_obs_date text,                       -- indicators: observation date already announced; "new data" = a different date
  unsub_token uuid not null default gen_random_uuid(),   -- one-click unsubscribe link in every alert email
  created_at timestamptz not null default now(),
  constraint alert_threshold check ((condition = 'changes' and threshold is null) or (condition <> 'changes' and threshold is not null)),
  constraint alert_changes_only_indicators check (condition <> 'changes' or target_type = 'indicator')
);
create unique index if not exists alerts_unsub on alerts (unsub_token);
-- Public Q&A, indexable once a moderator publishes it (financial content: every post is reviewed first).
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  target_type text not null check (target_type in ('ticker','indicator')),
  target_slug text not null,
  body text not null check (length(body) between 10 and 500),
  answer text,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists questions_target on questions (target_type, target_slug) where status = 'published';
create index if not exists watchlist_user on watchlist (user_id);
create index if not exists saved_user on saved_articles (user_id);
create index if not exists alerts_active on alerts (target_type, target_slug) where active;

-- Free-plan limits.
create or replace function enforce_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare lim int; n int; pro boolean;
begin
  select plan = 'pro' into pro from profiles where id = new.user_id;
  if coalesce(pro, false) then return new; end if;
  if tg_table_name = 'watchlist' then lim := 5; select count(*) into n from watchlist where user_id = new.user_id;
  elsif tg_table_name = 'saved_articles' then lim := 10; select count(*) into n from saved_articles where user_id = new.user_id;
  elsif tg_table_name = 'alerts' then lim := 1; select count(*) into n from alerts where user_id = new.user_id and active;
  else lim := 0; n := 0; end if;
  if n >= lim then raise exception 'free_limit_reached' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists watchlist_limit on watchlist;
create trigger watchlist_limit before insert on watchlist for each row execute function enforce_limit();
drop trigger if exists alerts_limit on alerts;
create trigger alerts_limit before insert on alerts for each row execute function enforce_limit();
drop trigger if exists saved_limit on saved_articles;
create trigger saved_limit before insert on saved_articles for each row execute function enforce_limit();

-- Row level security: users see and change only their own rows.
alter table profiles enable row level security;
alter table watchlist enable row level security;
alter table saved_articles enable row level security;
alter table alerts enable row level security;
alter table questions enable row level security;
create policy "own profile read" on profiles for select using (auth.uid() = id);          -- plan/level changed only by service role (Stripe webhook)
create policy "own watchlist" on watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own saved" on saved_articles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own alerts read" on alerts for select using (auth.uid() = user_id);
create policy "own alerts create" on alerts for insert with check (auth.uid() = user_id and active and last_triggered_at is null);
create policy "own alerts delete" on alerts for delete using (auth.uid() = user_id);
-- Updates (deactivate, trigger bookkeeping) go through the service role only, so a user cannot reactivate past the free limit.
create policy "read published questions" on questions for select using (status = 'published' or auth.uid() = user_id);
create policy "ask a question" on questions for insert with check (auth.uid() = user_id and status = 'pending' and answer is null);

-- Alert evaluation: call /api/cron/alerts every 15 minutes with the CRON_SECRET bearer token. Example with pg_cron + pg_net (replace host and secret):
-- select cron.schedule('meridian-alerts', '*/15 * * * *', $$select net.http_get(url := 'https://YOUR-DOMAIN/api/cron/alerts', headers := jsonb_build_object('Authorization','Bearer YOUR_CRON_SECRET'))$$);

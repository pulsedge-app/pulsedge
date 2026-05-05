-- Daily market analyses
create table if not exists daily_analyses (
  id uuid default gen_random_uuid() primary key,
  symbol text not null,
  date date not null default current_date,
  bias text not null check (bias in ('Bullish', 'Bearish', 'Neutral')),
  reasoning text not null,
  key_levels jsonb not null default '[]'::jsonb,
  entry_zones jsonb not null default '[]'::jsonb,
  invalidation_points jsonb not null default '[]'::jsonb,
  price_at_analysis numeric(20, 8),
  created_at timestamp with time zone default now(),
  constraint daily_analyses_symbol_date_key unique (symbol, date)
);

-- Row-level security
alter table daily_analyses enable row level security;

-- All users can read analyses (entry zones gated on frontend)
create policy "Analyses are publicly readable"
  on daily_analyses for select
  using (true);

-- Only service role can insert/update (via cron API route)
create policy "Service role can manage analyses"
  on daily_analyses for all
  using (auth.role() = 'service_role');

-- Index for fast symbol+date lookups
create index if not exists daily_analyses_symbol_date_idx
  on daily_analyses (symbol, date desc);

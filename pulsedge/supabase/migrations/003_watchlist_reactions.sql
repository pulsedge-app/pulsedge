CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  symbol text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, symbol)
);
ALTER TABLE user_watchlist enable row level security;
CREATE POLICY "Users manage own watchlist"
  on user_watchlist for all
  using (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references community_messages(id) on delete cascade,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  unique(message_id, user_id)
);
ALTER TABLE community_reactions enable row level security;
CREATE POLICY "Reactions publicly readable"
  on community_reactions for select using (true);
CREATE POLICY "Users insert own reactions"
  on community_reactions for insert
  with check (auth.uid() = user_id);
CREATE POLICY "Users delete own reactions"
  on community_reactions for delete
  using (auth.uid() = user_id);

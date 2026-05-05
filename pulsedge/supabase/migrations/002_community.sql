CREATE TABLE IF NOT EXISTS community_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  username text not null,
  message text not null check (char_length(message) <= 280),
  is_bot boolean default false,
  created_at timestamp with time zone default now()
);

ALTER TABLE community_messages enable row level security;

CREATE POLICY "Messages are publicly readable"
  ON community_messages FOR SELECT USING (true);

CREATE POLICY "Verified users can insert messages"
  ON community_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast chronological feed queries
CREATE INDEX IF NOT EXISTS community_messages_created_at_idx
  ON community_messages (created_at DESC);

-- Enable Supabase Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;

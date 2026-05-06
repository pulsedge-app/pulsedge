import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SEED_MESSAGES = [
  {
    username: 'PulseAI',
    message: '👋 Welcome to Pulse Community! Share your market views, ask questions, and connect with other traders. Analysis updates daily at 06:00 UTC.',
    is_bot: true,
    offset_minutes: 120,
  },
  {
    username: 'PulseAI',
    message: '📊 Gold (XAUUSD) remains a key watch — geopolitical premium staying elevated. Watch the $3,280 level as near-term support.',
    is_bot: true,
    offset_minutes: 90,
  },
  {
    username: 'PulseAI',
    message: '₿ Bitcoin holding above $95k consolidation zone. On-chain data shows accumulation by long-term holders — structurally constructive.',
    is_bot: true,
    offset_minutes: 60,
  },
  {
    username: 'PulseAI',
    message: '💱 EUR/USD: Dollar strength persisting ahead of Fed speak. Any bounce above 1.0780 offers a potential short opportunity intraday.',
    is_bot: true,
    offset_minutes: 30,
  },
  {
    username: 'PulseAI',
    message: '📅 Reminder: High-impact US data due this week. Check the Economic Calendar tab for exact times and forecasts. Trade safe! 🎯',
    is_bot: true,
    offset_minutes: 5,
  },
];

async function runSeed() {
  const supabase = createClient();

  const { count } = await supabase
    .from('community_messages')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    return NextResponse.json({ seeded: false, reason: 'already has messages' });
  }

  const now = Date.now();
  const rows = SEED_MESSAGES.map((m) => ({
    user_id: null,
    username: m.username,
    message: m.message,
    is_bot: m.is_bot,
    created_at: new Date(now - m.offset_minutes * 60_000).toISOString(),
  }));

  const { error } = await supabase.from('community_messages').insert(rows);
  if (error) return NextResponse.json({ seeded: false, error: error.message }, { status: 500 });

  return NextResponse.json({ seeded: true, count: rows.length });
}

export async function GET() {
  try {
    return await runSeed();
  } catch (err) {
    return NextResponse.json({ seeded: false, error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    return await runSeed();
  } catch (err) {
    return NextResponse.json({ seeded: false, error: String(err) }, { status: 500 });
  }
}

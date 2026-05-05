import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

type BotMessageType =
  | 'morning'
  | 'midday'
  | 'evening'
  | 'bias_bullish'
  | 'bias_bearish'
  | 'news_warning';

const BOT_MESSAGES: Record<string, string> = {
  morning:
    'Good morning traders! 🌅 Markets are opening — what pairs are you watching today?',
  midday:
    'Halfway through the session — how are your trades going? Share your thoughts 👇',
  evening:
    'Markets closing soon 🔔 What was your best trade today?',
};

function getBotMessage(
  type: BotMessageType,
  meta?: { symbol?: string; event?: string }
): string {
  if (type === 'bias_bullish' && meta?.symbol)
    return `🟢 ${meta.symbol} just flipped Bullish — are you buying the dip or waiting for confirmation?`;
  if (type === 'bias_bearish' && meta?.symbol)
    return `🔴 ${meta.symbol} showing Bearish bias today — who's shorting this? 🐻`;
  if (type === 'news_warning' && meta?.event)
    return `⚠️ High impact news in 1 hour — ${meta.event}. How are you positioning?`;
  return BOT_MESSAGES[type] ?? '';
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { type, symbol, event } = body as {
    type: BotMessageType;
    symbol?: string;
    event?: string;
  };

  const message = getBotMessage(type, { symbol, event });
  if (!message) return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from('community_messages').insert({
    user_id: null,
    username: 'Pulse AI',
    message,
    is_bot: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message });
}

// Vercel cron uses GET
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') as BotMessageType | null;
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });

  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const message = getBotMessage(type, {});
  if (!message) return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from('community_messages').insert({
    user_id: null,
    username: 'Pulse AI',
    message,
    is_bot: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message });
}

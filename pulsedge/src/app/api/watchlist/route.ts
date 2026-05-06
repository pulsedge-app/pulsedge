import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 200 });

  const { data } = await supabase
    .from('user_watchlist')
    .select('symbol')
    .eq('user_id', user.id);

  return NextResponse.json(data?.map((r: { symbol: string }) => r.symbol) ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await req.json();
  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

  const { error } = await supabase
    .from('user_watchlist')
    .insert({ user_id: user.id, symbol });

  if (error && error.code !== '23505') { // ignore duplicate
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol } = await req.json();
  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

  await supabase
    .from('user_watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('symbol', symbol);

  return NextResponse.json({ ok: true });
}

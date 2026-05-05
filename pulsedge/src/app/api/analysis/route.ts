import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const symbol = searchParams.get('symbol');

  const supabase = createServiceClient();
  let query = supabase
    .from('daily_analyses')
    .select('*')
    .eq('date', date)
    .order('symbol');

  if (symbol) query = query.eq('symbol', symbol);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get('symbol');
    const supabase = createClient();

    let query = supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (symbol) {
      query = query.ilike('message', `%${symbol.toUpperCase()}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json([], { status: 500 });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

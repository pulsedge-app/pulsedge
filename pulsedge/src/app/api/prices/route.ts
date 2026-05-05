import { NextRequest, NextResponse } from 'next/server';

const TD_BASE = 'https://api.twelvedata.com';

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get('symbols');
  if (!symbols) return NextResponse.json({}, { status: 400 });

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({}, { status: 500 });

  try {
    const url = `${TD_BASE}/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const raw = await res.json();

    // Twelve Data returns a single object when one symbol, nested objects when multiple
    const isSingle = !!raw.close;
    const entries = isSingle
      ? { [raw.symbol]: raw }
      : (raw as Record<string, Record<string, string>>);

    const result: Record<string, { price: number; change_percent: number }> = {};
    for (const [sym, data] of Object.entries(entries)) {
      if (data && data.close) {
        result[sym] = {
          price: parseFloat(data.close as string),
          change_percent: parseFloat(data.percent_change as string),
        };
      }
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}

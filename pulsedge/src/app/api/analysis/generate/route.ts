import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateDailyAnalysis } from '@/lib/claude';
import { getTimeSeries, getQuote } from '@/lib/twelve-data';
import { MARKET_SYMBOLS } from '@/lib/markets';

export const maxDuration = 300;

async function triggerBotPost(type: string, symbol?: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    await fetch(`${base}/api/bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
      },
      body: JSON.stringify({ type, symbol }),
    });
  } catch {
    // non-critical — don't fail analysis if bot post fails
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];
  const results: Array<{ symbol: string; status: string; bias?: string; error?: string }> = [];

  // Track which symbols flipped bias today for bot posts (max 2 announcements to avoid spam)
  let botPostCount = 0;

  for (const market of MARKET_SYMBOLS) {
    try {
      const [bars, quote] = await Promise.all([
        getTimeSeries(market.tdSymbol, '1day', 10),
        getQuote(market.tdSymbol),
      ]);

      if (!quote || bars.length === 0) {
        results.push({ symbol: market.symbol, status: 'skipped', error: 'No data' });
        continue;
      }

      const analysis = await generateDailyAnalysis({
        symbol: market.symbol,
        label: market.label,
        currentPrice: quote.price,
        bars,
      });

      const { error } = await supabase
        .from('daily_analyses')
        .upsert({ ...analysis, date: today }, { onConflict: 'symbol,date' });

      if (error) throw error;

      results.push({ symbol: market.symbol, status: 'ok', bias: analysis.bias });

      // Trigger bot post for notable bias signals (limit to avoid spam)
      if (botPostCount < 2 && (analysis.bias === 'Bullish' || analysis.bias === 'Bearish')) {
        const type = analysis.bias === 'Bullish' ? 'bias_bullish' : 'bias_bearish';
        await triggerBotPost(type, market.symbol);
        botPostCount++;
      }
    } catch (err) {
      results.push({
        symbol: market.symbol,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({ date: today, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

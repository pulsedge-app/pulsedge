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

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // no secret set, allow all

  // Support both header styles: Vercel cron uses x-cron-secret, manual calls use Authorization Bearer
  const xCronSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('authorization');

  return xCronSecret === cronSecret || authHeader === `Bearer ${cronSecret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];
  const results: Array<{ symbol: string; status: string; bias?: string; error?: string; priceSource?: string }> = [];

  let botPostCount = 0;

  for (const market of MARKET_SYMBOLS) {
    try {
      console.log(`[analysis] Processing ${market.symbol}...`);

      // Try to get price data — but don't skip if it fails
      let bars: Awaited<ReturnType<typeof getTimeSeries>> = [];
      let quote: Awaited<ReturnType<typeof getQuote>> = null;
      let priceSource = 'live';

      try {
        [bars, quote] = await Promise.all([
          getTimeSeries(market.tdSymbol, '1day', 10),
          getQuote(market.tdSymbol),
        ]);
      } catch (priceErr) {
        console.warn(`[analysis] ${market.symbol}: price fetch threw — ${priceErr}`);
      }

      if (!quote || bars.length === 0) {
        console.warn(`[analysis] ${market.symbol}: no live price data, generating without it`);
        priceSource = 'none';
      }

      const analysis = await generateDailyAnalysis({
        symbol: market.symbol,
        label: market.label,
        currentPrice: quote?.price ?? null,
        bars,
      });

      const { error: dbError } = await supabase
        .from('daily_analyses')
        .upsert(
          {
            ...analysis,
            date: today,
            confidence_score: analysis.confidence_score ?? 70,
          },
          { onConflict: 'symbol,date' }
        );

      if (dbError) {
        console.error(`[analysis] ${market.symbol}: DB upsert failed —`, dbError);
        throw dbError;
      }

      console.log(`[analysis] ${market.symbol}: ✅ ${analysis.bias} (price: ${priceSource})`);
      results.push({ symbol: market.symbol, status: 'ok', bias: analysis.bias, priceSource });

      if (botPostCount < 2 && (analysis.bias === 'Bullish' || analysis.bias === 'Bearish')) {
        const type = analysis.bias === 'Bullish' ? 'bias_bullish' : 'bias_bearish';
        await triggerBotPost(type, market.symbol);
        botPostCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[analysis] ${market.symbol}: ❌ ${msg}`);
      results.push({ symbol: market.symbol, status: 'error', error: msg });
    }

    // Respect API rate limits
    await new Promise((r) => setTimeout(r, 1200));
  }

  const summary = {
    date: today,
    total: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };

  console.log(`[analysis] Done: ${summary.ok}/${summary.total} succeeded`);
  return NextResponse.json(summary);
}

export async function GET(req: NextRequest) {
  return POST(req);
}

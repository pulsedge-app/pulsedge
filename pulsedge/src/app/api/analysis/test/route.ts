import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getQuote } from '@/lib/twelve-data';
import Anthropic from '@anthropic-ai/sdk';

/**
 * GET /api/analysis/test
 * No auth required. Tests all three external connections.
 */
export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Twelve Data
  try {
    const quote = await getQuote('EURUSD');
    if (quote && quote.price > 0) {
      results.twelve_data = { ok: true, detail: `EURUSD price: ${quote.price}` };
    } else {
      results.twelve_data = { ok: false, detail: 'Quote returned null or zero — check TWELVE_DATA_API_KEY and credit balance' };
    }
  } catch (err) {
    results.twelve_data = { ok: false, detail: String(err) };
  }

  // 2. Supabase
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from('daily_analyses')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    results.supabase = { ok: true, detail: `daily_analyses row count: ${count ?? 0}` };
  } catch (err) {
    results.supabase = { ok: false, detail: String(err) };
  }

  // 3. Claude API
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    results.claude = { ok: text.includes('OK'), detail: `Response: "${text}"` };
  } catch (err) {
    results.claude = { ok: false, detail: String(err) };
  }

  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json(
    {
      status: allOk ? 'all_systems_go' : 'issues_detected',
      results,
    },
    { status: allOk ? 200 : 500 }
  );
}

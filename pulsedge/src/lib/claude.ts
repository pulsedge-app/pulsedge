import Anthropic from '@anthropic-ai/sdk';
import type { DailyAnalysis, Bias } from '@/types';
import type { OHLCVBar } from './twelve-data';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a professional institutional trading analyst with expertise in technical analysis, price action, and market structure. You provide clear, concise, and actionable trading analysis. Your analysis is data-driven, objective, and follows institutional trading principles including:
- Market structure (HH/HL for bullish, LH/LL for bearish)
- Key support/resistance levels
- Fair value gaps and order blocks
- Session highs/lows (Asia, London, NY)
- Risk management (minimum 2:1 R/R)

Keep responses concise and professional. No hype, no guarantees.`;

interface AnalysisInput {
  symbol: string;
  label: string;
  currentPrice: number;
  bars: OHLCVBar[];
}

export async function generateDailyAnalysis(
  input: AnalysisInput
): Promise<Omit<DailyAnalysis, 'id' | 'created_at' | 'date'>> {
  const { symbol, label, currentPrice, bars } = input;

  const recentBars = bars.slice(0, 5);
  const priceRange = `H: ${Math.max(...recentBars.map((b) => b.high)).toFixed(4)} / L: ${Math.min(...recentBars.map((b) => b.low)).toFixed(4)}`;
  const barSummary = recentBars
    .map((b) => `${b.datetime}: O:${b.open} H:${b.high} L:${b.low} C:${b.close}`)
    .join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze ${label} (${symbol}) for today's trading session.

Current price: ${currentPrice}
Recent OHLCV (last 5 days):
${barSummary}
5-day range: ${priceRange}

Respond ONLY with valid JSON in this exact structure:
{
  "bias": "Bullish" | "Bearish" | "Neutral",
  "reasoning": "2-3 sentence explanation of the bias based on price action and structure",
  "key_levels": [
    {"price": number, "label": "string", "type": "support" | "resistance" | "pivot"}
  ],
  "entry_zones": [
    {
      "entry": number,
      "stop_loss": number,
      "take_profit": [number, number],
      "direction": "long" | "short",
      "notes": "brief note"
    }
  ],
  "invalidation_points": [
    {"price": number, "condition": "string"}
  ]
}

Provide 2-4 key levels, 1-2 entry zones, and 1-2 invalidation points.`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    symbol,
    bias: parsed.bias as Bias,
    reasoning: parsed.reasoning,
    key_levels: parsed.key_levels ?? [],
    entry_zones: parsed.entry_zones ?? [],
    invalidation_points: parsed.invalidation_points ?? [],
    price_at_analysis: currentPrice,
  };
}

export async function streamChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  isLoggedIn: boolean
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = isLoggedIn
    ? `${SYSTEM_PROMPT}\n\nThe user is a registered member. Provide detailed, personalised trading insights including specific levels, entry ideas, and risk management guidance.`
    : `${SYSTEM_PROMPT}\n\nThe user is a guest. Provide helpful general market analysis and education. Encourage them to sign up for detailed entry plans and personalised analysis.`;

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });
}

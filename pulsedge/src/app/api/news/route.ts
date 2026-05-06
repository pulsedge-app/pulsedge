import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { NewsItem } from '@/types';

export const dynamic = 'force-dynamic';

// 5-minute in-memory cache (best-effort on warm processes)
let cache: { items: NewsItem[]; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseXml(xml: string, tag: string): string {
  const m = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`)
  );
  return (m?.[1] ?? m?.[2] ?? '').trim();
}

function extractItems(xml: string): Array<{ headline: string; url: string; source: string; publishedAt: string }> {
  const items: Array<{ headline: string; url: string; source: string; publishedAt: string }> = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const title = parseXml(block, 'title');
    const link = parseXml(block, 'link') || parseXml(block, 'guid');
    const pubDate = parseXml(block, 'pubDate') || parseXml(block, 'dc:date') || new Date().toISOString();
    if (title) items.push({ headline: title, url: link, source: '', publishedAt: pubDate });
  }
  return items;
}

async function fetchFeed(url: string, source: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Pulsedge/1.0 (trading intelligence platform)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return extractItems(xml).map((i) => ({ ...i, source }));
  } catch {
    return [];
  }
}

async function processWithClaude(
  raw: Array<{ headline: string; url: string; source: string; publishedAt: string }>
): Promise<NewsItem[]> {
  const input = raw.slice(0, 25).map((item, i) => ({ ...item, id: String(i) }));

  const prompt = `You are a professional trading news analyst. Analyze these financial news headlines.
For each relevant headline:
1. Score trading relevance 1-10 (10=highly relevant to forex/crypto/stock traders, 1=unrelated)
2. List affected instruments from: EURUSD, GBPUSD, USDJPY, XAUUSD, BTCUSD, ETHUSDT, SOLUSDT, SPX, AAPL, TSLA, NVDA
3. Write ONE trading context sentence (max 15 words, professional, actionable)
4. Classify: HIGH, MEDIUM, or LOW impact

Headlines JSON:
${JSON.stringify(input)}

Respond with a JSON array ONLY, no other text. Include only items with relevanceScore >= 7, max 10 items, sorted by score desc:
[{"id":"0","relevanceScore":9,"affectedPairs":["EURUSD"],"impact":"HIGH","aiContext":"ECB surprise hike could push EUR 80+ pips across majors."}]`;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as Array<{
      id: string; relevanceScore: number; affectedPairs: string[];
      impact: string; aiContext: string;
    }>;
    return parsed.map((p) => {
      const src = input.find((i) => i.id === p.id);
      if (!src) return null;
      return {
        id: p.id,
        headline: src.headline,
        url: src.url,
        source: src.source,
        publishedAt: src.publishedAt,
        relevanceScore: p.relevanceScore,
        affectedPairs: p.affectedPairs ?? [],
        impact: (p.impact as NewsItem['impact']) ?? 'MEDIUM',
        aiContext: p.aiContext,
      } satisfies NewsItem;
    }).filter((x): x is NewsItem => x !== null);
  } catch {
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.items);
  }

  const [reuters, cnbc] = await Promise.all([
    fetchFeed('https://feeds.reuters.com/reuters/businessNews', 'Reuters'),
    fetchFeed(
      'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
      'CNBC'
    ),
  ]);

  // Deduplicate by lowercased headline prefix
  const seen = new Set<string>();
  const combined = [...reuters, ...cnbc].filter((item) => {
    const key = item.headline.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (combined.length === 0) {
    return NextResponse.json([]);
  }

  const items = await processWithClaude(combined);
  cache = { items, ts: Date.now() };
  return NextResponse.json(items);
}

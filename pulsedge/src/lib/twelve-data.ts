import type { QuoteData } from '@/types';

const BASE_URL = 'https://api.twelvedata.com';
const API_KEY = process.env.TWELVE_DATA_API_KEY!;

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    if (data.status === 'error' || !data.close) return null;
    return {
      symbol: data.symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      change_percent: parseFloat(data.percent_change),
      open: parseFloat(data.open),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      close: parseFloat(data.close),
      volume: parseInt(data.volume ?? '0'),
      timestamp: parseInt(data.timestamp),
    };
  } catch {
    return null;
  }
}

export interface OHLCVBar {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getTimeSeries(
  symbol: string,
  interval: string = '1day',
  outputsize: number = 10
): Promise<OHLCVBar[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.status === 'error' || !data.values) return [];
    return data.values.map((bar: Record<string, string>) => ({
      datetime: bar.datetime,
      open: parseFloat(bar.open),
      high: parseFloat(bar.high),
      low: parseFloat(bar.low),
      close: parseFloat(bar.close),
      volume: parseInt(bar.volume ?? '0'),
    }));
  } catch {
    return [];
  }
}

// Returns close prices oldest→newest for sparkline display
export async function getSparklinePoints(
  symbol: string,
  interval = '1h',
  bars = 8
): Promise<number[]> {
  const data = await getTimeSeries(symbol, interval, bars);
  return data.map((b) => b.close).reverse();
}

export async function getMultipleQuotes(
  symbols: string[]
): Promise<Record<string, QuoteData | null>> {
  const results = await Promise.all(
    symbols.map(async (s) => ({ symbol: s, data: await getQuote(s) }))
  );
  return Object.fromEntries(results.map((r) => [r.symbol, r.data]));
}

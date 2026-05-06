import type { MarketSymbol } from '@/types';

export const MARKET_SYMBOLS: MarketSymbol[] = [
  // Forex
  { symbol: 'XAUUSD', tvSymbol: 'XAUUSD', tdSymbol: 'XAU/USD', label: 'Gold / USD', category: 'forex' },
  { symbol: 'EURUSD', tvSymbol: 'EURUSD', tdSymbol: 'EUR/USD', label: 'Euro / USD', category: 'forex' },
  { symbol: 'GBPUSD', tvSymbol: 'GBPUSD', tdSymbol: 'GBP/USD', label: 'Pound / USD', category: 'forex' },
  { symbol: 'USDJPY', tvSymbol: 'USDJPY', tdSymbol: 'USD/JPY', label: 'USD / Yen', category: 'forex' },
  // Crypto
  { symbol: 'BTCUSD', tvSymbol: 'BTCUSD', tdSymbol: 'BTC/USD', label: 'Bitcoin / USD', category: 'crypto' },
  { symbol: 'ETHUSDT', tvSymbol: 'BINANCE:ETHUSDT', tdSymbol: 'ETH/USDT:Binance', label: 'ETH / USDT', category: 'crypto' },
  { symbol: 'SOLUSDT', tvSymbol: 'BINANCE:SOLUSDT', tdSymbol: 'SOL/USDT:Binance', label: 'SOL / USDT', category: 'crypto' },
  // Stocks
  { symbol: 'SPX', tvSymbol: 'SP:SPX', tdSymbol: 'SPX', label: 'S&P 500', category: 'stocks' },
  { symbol: 'AAPL', tvSymbol: 'NASDAQ:AAPL', tdSymbol: 'AAPL', label: 'Apple Inc.', category: 'stocks' },
  { symbol: 'TSLA', tvSymbol: 'NASDAQ:TSLA', tdSymbol: 'TSLA', label: 'Tesla Inc.', category: 'stocks' },
  { symbol: 'NVDA', tvSymbol: 'NASDAQ:NVDA', tdSymbol: 'NVDA', label: 'NVIDIA Corp.', category: 'stocks' },
];

export const HERO_SYMBOLS = ['XAUUSD', 'BTCUSD', 'EURUSD'];

export const FOREX_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.category === 'forex');
export const CRYPTO_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.category === 'crypto');
export const STOCK_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.category === 'stocks');

export function getSymbolByKey(symbol: string): MarketSymbol | undefined {
  return MARKET_SYMBOLS.find((s) => s.symbol === symbol);
}

export function formatPrice(price: number, symbol: string): string {
  if (price === 0) return '—';
  if (['BTCUSD', 'BTCUSDT'].includes(symbol)) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (['XAUUSD', 'SPX', 'ETHUSDT'].includes(symbol)) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (['SOLUSDT', 'AAPL', 'TSLA', 'NVDA'].includes(symbol)) return price.toFixed(2);
  return price.toFixed(4);
}

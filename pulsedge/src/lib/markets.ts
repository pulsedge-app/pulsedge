import type { MarketSymbol } from '@/types';

export const MARKET_SYMBOLS: MarketSymbol[] = [
  // Forex
  { symbol: 'XAUUSD', tvSymbol: 'XAUUSD', tdSymbol: 'XAU/USD', label: 'Gold / USD', category: 'forex' },
  { symbol: 'BTCUSD', tvSymbol: 'BTCUSD', tdSymbol: 'BTC/USD', label: 'Bitcoin / USD', category: 'forex' },
  { symbol: 'EURUSD', tvSymbol: 'EURUSD', tdSymbol: 'EUR/USD', label: 'Euro / USD', category: 'forex' },
  { symbol: 'GBPUSD', tvSymbol: 'GBPUSD', tdSymbol: 'GBP/USD', label: 'Pound / USD', category: 'forex' },
  { symbol: 'USDJPY', tvSymbol: 'USDJPY', tdSymbol: 'USD/JPY', label: 'USD / Yen', category: 'forex' },
  // Crypto
  { symbol: 'BTCUSDT', tvSymbol: 'BINANCE:BTCUSDT', tdSymbol: 'BTC/USDT:Binance', label: 'BTC / USDT', category: 'crypto' },
  { symbol: 'ETHUSDT', tvSymbol: 'BINANCE:ETHUSDT', tdSymbol: 'ETH/USDT:Binance', label: 'ETH / USDT', category: 'crypto' },
  { symbol: 'SOLUSDT', tvSymbol: 'BINANCE:SOLUSDT', tdSymbol: 'SOL/USDT:Binance', label: 'SOL / USDT', category: 'crypto' },
  // Stocks
  { symbol: 'SPX', tvSymbol: 'SP:SPX', tdSymbol: 'SPX', label: 'S&P 500', category: 'stocks' },
  { symbol: 'AAPL', tvSymbol: 'NASDAQ:AAPL', tdSymbol: 'AAPL', label: 'Apple Inc.', category: 'stocks' },
  { symbol: 'TSLA', tvSymbol: 'NASDAQ:TSLA', tdSymbol: 'TSLA', label: 'Tesla Inc.', category: 'stocks' },
];

export const FOREX_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.category === 'forex');
export const CRYPTO_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.category === 'crypto');
export const STOCK_SYMBOLS = MARKET_SYMBOLS.filter((s) => s.category === 'stocks');

export function getSymbolByKey(symbol: string): MarketSymbol | undefined {
  return MARKET_SYMBOLS.find((s) => s.symbol === symbol);
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { MARKET_SYMBOLS, FOREX_SYMBOLS, CRYPTO_SYMBOLS, STOCK_SYMBOLS, formatPrice } from '@/lib/markets';
import type { DailyAnalysis, LivePriceData, MarketSymbol } from '@/types';

type Tab = 'FOREX' | 'CRYPTO' | 'STOCKS' | 'WATCHLIST';

interface PairTableProps {
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  isLoggedIn: boolean;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'FOREX', label: '💱 Forex' },
  { key: 'CRYPTO', label: '₿ Crypto' },
  { key: 'STOCKS', label: '📈 Stocks' },
  { key: 'WATCHLIST', label: '⭐ Watchlist' },
];

const CATEGORY_SYMBOLS: Record<Tab, MarketSymbol[]> = {
  FOREX: FOREX_SYMBOLS,
  CRYPTO: CRYPTO_SYMBOLS,
  STOCKS: STOCK_SYMBOLS,
  WATCHLIST: [],
};

const BIAS_CFG = {
  Bullish: { badge: 'badge-bullish', icon: TrendingUp },
  Bearish: { badge: 'badge-bearish', icon: TrendingDown },
  Neutral: { badge: 'badge-neutral', icon: Minus },
};

function BiasBadge({ bias }: { bias: 'Bullish' | 'Bearish' | 'Neutral' }) {
  const { badge, icon: Icon } = BIAS_CFG[bias];
  return (
    <span className={badge}>
      <Icon className="w-2.5 h-2.5" />
      {bias}
    </span>
  );
}

export function PairTable({ analyses, prices, isLoggedIn }: PairTableProps) {
  const [tab, setTab] = useState<Tab>('FOREX');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);

  // Load watchlist
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((symbols: string[]) => setWatchlist(new Set(symbols)))
      .catch(() => {});
  }, [isLoggedIn]);

  const toggleStar = useCallback(
    async (symbol: string, e: React.MouseEvent) => {
      e.preventDefault();
      if (!isLoggedIn || toggling) return;
      setToggling(symbol);
      const starred = watchlist.has(symbol);
      setWatchlist((prev) => {
        const next = new Set(prev);
        starred ? next.delete(symbol) : next.add(symbol);
        return next;
      });
      try {
        await fetch('/api/watchlist', {
          method: starred ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        });
      } catch {
        // rollback
        setWatchlist((prev) => {
          const next = new Set(prev);
          starred ? next.add(symbol) : next.delete(symbol);
          return next;
        });
      }
      setToggling(null);
    },
    [isLoggedIn, toggling, watchlist]
  );

  const rows =
    tab === 'WATCHLIST'
      ? MARKET_SYMBOLS.filter((m) => watchlist.has(m.symbol))
      : CATEGORY_SYMBOLS[tab];

  return (
    <div className="card overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center border-b border-surface-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-teal border-teal'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-border text-[10px] text-slate-600 uppercase tracking-widest">
              <th className="text-left px-4 py-2.5 font-medium">Pair</th>
              <th className="text-right px-3 py-2.5 font-medium">Price</th>
              <th className="text-right px-3 py-2.5 font-medium">24h</th>
              <th className="text-center px-3 py-2.5 font-medium">Bias</th>
              <th className="text-right px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-600 text-sm">
                  {tab === 'WATCHLIST' && !isLoggedIn
                    ? 'Sign in to save your watchlist'
                    : tab === 'WATCHLIST'
                    ? 'No pairs starred yet — click ⭐ on any row'
                    : 'No pairs available'}
                </td>
              </tr>
            )}
            {rows.map((market) => {
              const lp = prices[market.symbol];
              const analysis = analyses[market.symbol];
              const bias = (analysis?.bias ?? 'Neutral') as 'Bullish' | 'Bearish' | 'Neutral';
              const pos = (lp?.change_percent ?? 0) >= 0;

              return (
                <tr
                  key={market.symbol}
                  className="border-b border-surface-border/50 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Pair */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {isLoggedIn && (
                        <button
                          onClick={(e) => toggleStar(market.symbol, e)}
                          className={`transition-colors ${
                            watchlist.has(market.symbol) ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'
                          }`}
                          aria-label={`${watchlist.has(market.symbol) ? 'Remove' : 'Add'} ${market.symbol} to watchlist`}
                        >
                          <Star
                            className="w-3.5 h-3.5"
                            fill={watchlist.has(market.symbol) ? 'currentColor' : 'none'}
                          />
                        </button>
                      )}
                      <div>
                        <p className="font-semibold text-white">{market.symbol}</p>
                        <p className="text-[10px] text-slate-600">{market.label}</p>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    {lp?.loading ? (
                      <div className="h-3 w-20 bg-white/5 rounded animate-pulse ml-auto" />
                    ) : (
                      formatPrice(lp?.price ?? 0, market.symbol)
                    )}
                  </td>

                  {/* 24h */}
                  <td className={`px-3 py-3 text-right font-mono tabular-nums font-medium ${pos ? 'text-green-400' : 'text-red-400'}`}>
                    {lp?.loading ? (
                      <div className="h-3 w-14 bg-white/5 rounded animate-pulse ml-auto" />
                    ) : (
                      `${pos ? '+' : ''}${(lp?.change_percent ?? 0).toFixed(2)}%`
                    )}
                  </td>

                  {/* Bias */}
                  <td className="px-3 py-3 text-center">
                    <BiasBadge bias={bias} />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/${market.symbol.toLowerCase()}`}
                      className="inline-flex items-center gap-1 text-teal opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium"
                    >
                      Analysis <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

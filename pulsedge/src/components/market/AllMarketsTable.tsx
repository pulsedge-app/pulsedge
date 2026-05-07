'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPrice } from '@/lib/markets';
import type { DailyAnalysis, MarketSymbol, LivePriceData } from '@/types';

const FLAGS: Record<string, string> = {
  XAUUSD: '🥇', EURUSD: '🇪🇺', GBPUSD: '🇬🇧', USDJPY: '🇯🇵',
  BTCUSD: '₿', ETHUSDT: '🔷', SOLUSDT: '◎',
  SPX: '🇺🇸', AAPL: '🍎', TSLA: '⚡', NVDA: '🟢',
};

const BIAS_ICON = { Bullish: TrendingUp, Bearish: TrendingDown, Neutral: Minus };
const BIAS_COLOR: Record<string, string> = {
  Bullish: 'text-green-400',
  Bearish: 'text-red-400',
  Neutral: 'text-amber-400',
};
// Left border accent by bias
const BIAS_BORDER: Record<string, string> = {
  Bullish: 'border-l-2 border-l-green-500/60',
  Bearish: 'border-l-2 border-l-red-500/60',
  Neutral: 'border-l-2 border-l-amber-500/40',
};

const TAB_CONTEXT: Record<string, string> = {
  FOREX: 'Top forex pairs by daily volume · Bias updates at 06:00 UTC',
  CRYPTO: 'Top crypto pairs to watch today · Spot trading signals',
  STOCKS: 'Most watched stocks today · AI-powered momentum signals',
  WATCHLIST: 'Your personalised watchlist · Sign in to save pairs',
};

type Tab = 'FOREX' | 'CRYPTO' | 'STOCKS' | 'WATCHLIST';

interface Props {
  markets: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  isLoggedIn: boolean;
}

export function AllMarketsTable({ markets, analyses, prices, isLoggedIn }: Props) {
  const [tab, setTab] = useState<Tab>('FOREX');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((d: { symbol: string }[]) => setWatchlist(d.map((x) => x.symbol)))
      .catch(() => {});
  }, [isLoggedIn]);

  const toggleWatch = useCallback(async (e: React.MouseEvent, symbol: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isLoggedIn || toggling) return;
    setToggling(symbol);
    const inList = watchlist.includes(symbol);
    setWatchlist((prev) => inList ? prev.filter((s) => s !== symbol) : [...prev, symbol]);
    try {
      await fetch('/api/watchlist', {
        method: inList ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
    } catch {
      setWatchlist((prev) => inList ? [...prev, symbol] : prev.filter((s) => s !== symbol));
    } finally {
      setToggling(null);
    }
  }, [isLoggedIn, toggling, watchlist]);

  const filtered = tab === 'WATCHLIST'
    ? markets.filter((m) => watchlist.includes(m.symbol))
    : markets.filter((m) => m.category === tab.toLowerCase());

  const TABS: Tab[] = ['FOREX', 'CRYPTO', 'STOCKS', 'WATCHLIST'];

  return (
    <div className="card overflow-hidden" id="markets">
      {/* Header + tabs */}
      <div className="flex items-center gap-0 px-5 py-3 border-b border-surface-border">
        <span className="text-base mr-2">📊</span>
        <h2 className="text-sm font-semibold mr-4">All Markets</h2>
        <div className="flex items-center gap-0.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                tab === t ? 'bg-teal/15 text-teal border border-teal/25' : 'text-slate-600 hover:text-slate-300'
              }`}>
              {t}
              {t === 'WATCHLIST' && watchlist.length > 0 && (
                <span className="ml-1 text-teal/60">{watchlist.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Context subtitle */}
      <div className="px-5 py-1.5 bg-white/[0.015] border-b border-surface-border/40">
        <p className="text-[10px] text-slate-600">{TAB_CONTEXT[tab]}</p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_32px] gap-2 px-5 py-1.5 border-b border-surface-border/50">
        <span className="text-[9px] uppercase tracking-widest text-slate-700">Pair</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-700 text-right">Price</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-700 text-right">24h</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-700 text-right">Bias</span>
        <span />
      </div>

      {/* Rows */}
      <div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-600">
            {tab === 'WATCHLIST'
              ? isLoggedIn ? 'Star markets above to add them here' : 'Sign in to create your watchlist'
              : 'No markets'}
          </div>
        ) : (
          filtered.map((market, i) => {
            const analysis = analyses[market.symbol];
            const price = prices[market.symbol];
            const bias = analysis?.bias ?? null;
            const changePos = (price?.change_percent ?? 0) >= 0;
            const inWatch = watchlist.includes(market.symbol);
            const BiasIcon = bias ? BIAS_ICON[bias] : null;
            const biasBorder = bias ? BIAS_BORDER[bias] : 'border-l-2 border-l-transparent';

            return (
              <Link key={market.symbol} href={`/dashboard/${market.symbol.toLowerCase()}`}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_32px] gap-2 items-center px-5 py-0 min-h-[40px] hover:bg-white/[0.03] transition-colors group ${
                  i % 2 === 1 ? 'bg-white/[0.015]' : ''
                } ${biasBorder}`}>

                {/* Symbol */}
                <div className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center shrink-0">{FLAGS[market.symbol] ?? '💱'}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-200">{market.symbol}</span>
                    <span className="hidden sm:inline text-[10px] text-slate-700 ml-1.5">{market.label}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  {price?.loading ? (
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse ml-auto" />
                  ) : (
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {formatPrice(price?.price ?? 0, market.symbol)}
                    </span>
                  )}
                </div>

                {/* 24h change */}
                <div className="text-right">
                  {price?.loading ? (
                    <div className="h-3 w-10 bg-white/10 rounded animate-pulse ml-auto" />
                  ) : (
                    <span className={`text-xs font-mono font-semibold ${changePos ? 'text-green-400' : 'text-red-400'}`}>
                      {changePos ? '+' : ''}{(price?.change_percent ?? 0).toFixed(2)}%
                    </span>
                  )}
                </div>

                {/* Bias */}
                <div className="flex items-center justify-end gap-1">
                  {bias && BiasIcon ? (
                    <BiasIcon className={`w-3.5 h-3.5 ${BIAS_COLOR[bias]}`} />
                  ) : (
                    <span className="text-[10px] text-slate-700">—</span>
                  )}
                </div>

                {/* Star / arrow */}
                {isLoggedIn ? (
                  <button onClick={(e) => toggleWatch(e, market.symbol)}
                    className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
                      inWatch ? 'text-amber-400' : 'text-slate-700 hover:text-slate-400 opacity-0 group-hover:opacity-100'
                    }`} title={inWatch ? 'Remove from watchlist' : 'Add to watchlist'}>
                    <Star className="w-3.5 h-3.5" fill={inWatch ? 'currentColor' : 'none'} />
                  </button>
                ) : (
                  <span />
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

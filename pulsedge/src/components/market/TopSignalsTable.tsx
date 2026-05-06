'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Lock, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/markets';
import type { DailyAnalysis, MarketSymbol, LivePriceData } from '@/types';

const SIGNAL_SYMBOLS = ['XAUUSD', 'BTCUSD', 'EURUSD'];

const FLAGS: Record<string, string> = {
  XAUUSD: '🥇',
  BTCUSD: '₿',
  EURUSD: '🇪🇺',
};

const BIAS_CONFIG = {
  Bullish: {
    badge: 'bg-green-500/15 text-green-400 border-green-500/25',
    dot: 'bg-green-400',
    label: 'BUY TODAY',
    icon: TrendingUp,
  },
  Bearish: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    dot: 'bg-red-400',
    label: 'SELL TODAY',
    icon: TrendingDown,
  },
  Neutral: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    dot: 'bg-amber-400',
    label: 'WATCH',
    icon: Minus,
  },
};

interface Props {
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  markets: MarketSymbol[];
  isLoggedIn: boolean;
  isVerified: boolean;
}

export function TopSignalsTable({ analyses, prices, markets, isLoggedIn, isVerified }: Props) {
  const canSeeEntries = isLoggedIn && isVerified;

  const rows = SIGNAL_SYMBOLS.map((sym) => ({
    market: markets.find((m) => m.symbol === sym)!,
    analysis: analyses[sym] ?? null,
    price: prices[sym],
  })).filter((r) => r.market);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
        <span className="text-base">🎯</span>
        <h2 className="text-sm font-semibold">Today's Top Signals</h2>
        <span className="text-[10px] text-slate-600 ml-1">AI-curated · Updated 06:00 UTC</span>
      </div>

      {/* Table */}
      <div className="divide-y divide-surface-border/60">
        {rows.map(({ market, analysis, price }) => {
          const bias = analysis?.bias ?? 'Neutral';
          const cfg = BIAS_CONFIG[bias];
          const BiasIcon = cfg.icon;
          const changePos = (price?.change_percent ?? 0) >= 0;

          return (
            <Link
              key={market.symbol}
              href={`/dashboard/${market.symbol.toLowerCase()}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
            >
              {/* Flag + name */}
              <span className="text-lg w-8 text-center shrink-0">{FLAGS[market.symbol] ?? '💱'}</span>
              <div className="min-w-[90px]">
                <p className="text-sm font-bold text-slate-100">{market.symbol}</p>
                <p className="text-[10px] text-slate-600">{market.label}</p>
              </div>

              {/* Signal badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                <BiasIcon className="w-3 h-3" />
                {cfg.label}
              </div>

              {/* Price */}
              <div className="ml-auto text-right">
                {price?.loading ? (
                  <div className="h-4 w-20 bg-white/8 rounded animate-pulse" />
                ) : (
                  <>
                    <p className="text-sm font-bold font-mono text-slate-100">
                      {formatPrice(price?.price ?? 0, market.symbol)}
                    </p>
                    <p className={`text-[10px] font-mono ${changePos ? 'text-green-400' : 'text-red-400'}`}>
                      {changePos ? '+' : ''}{(price?.change_percent ?? 0).toFixed(2)}%
                    </p>
                  </>
                )}
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 ml-1" />
            </Link>
          );
        })}
      </div>

      {/* Unlock CTA */}
      {!canSeeEntries && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-teal/5 border-t border-teal/15">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-teal shrink-0" />
            <span className="text-xs text-slate-400">
              Entry · SL · TP unlocked for{' '}
              <span className="text-teal font-semibold">FREE members</span>
            </span>
          </div>
          <Link
            href="/auth/signup"
            className="flex items-center gap-1 text-xs font-bold text-teal hover:text-white transition-colors whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            Join 2,400+ traders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

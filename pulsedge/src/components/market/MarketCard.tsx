'use client';

import Link from 'next/link';
import { Lock, TrendingUp, TrendingDown, Minus, ExternalLink, ArrowRight } from 'lucide-react';
import type { DailyAnalysis, MarketSymbol, LivePriceData } from '@/types';

interface MarketCardProps {
  market: MarketSymbol;
  analysis: DailyAnalysis | null;
  livePrice: LivePriceData;
  isLoggedIn: boolean;
}

const BIAS_CONFIG = {
  Bullish: {
    bar: 'bg-green-500',
    badge: 'bg-green-500/15 text-green-400 border-green-500/25',
    icon: TrendingUp,
    dot: 'bg-green-500',
  },
  Bearish: {
    bar: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    icon: TrendingDown,
    dot: 'bg-red-500',
  },
  Neutral: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    icon: Minus,
    dot: 'bg-amber-500',
  },
};

function formatPrice(price: number, symbol: string): string {
  if (price === 0) return '—';
  const crypto = ['BTCUSDT', 'ETHUSDT', 'BTCUSD'];
  const highValue = ['XAUUSD', 'BTCUSD', 'BTCUSDT', 'SPX'];
  if (crypto.includes(symbol)) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (highValue.includes(symbol)) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === 'SOLUSDT') return price.toFixed(2);
  return price.toFixed(4);
}

function truncateToSentences(text: string, count = 2): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, count).join(' ').trim() || text.slice(0, 200);
}

// Plausible-looking blurred values based on analysis
function getLockedValues(analysis: DailyAnalysis | null, market: MarketSymbol): { entry: string; sl: string; tp: string } {
  if (analysis?.entry_zones?.[0]) {
    const z = analysis.entry_zones[0];
    const fmt = (n: number) => formatPrice(n, market.symbol);
    return { entry: fmt(z.entry), sl: fmt(z.stop_loss), tp: fmt(z.take_profit[0] ?? z.entry) };
  }
  return { entry: '—', sl: '—', tp: '—' };
}

export function MarketCard({ market, analysis, livePrice, isLoggedIn }: MarketCardProps) {
  const bias = analysis?.bias ?? 'Neutral';
  const cfg = BIAS_CONFIG[bias];
  const BiasIcon = cfg.icon;
  const locked = getLockedValues(analysis, market);
  const changePos = livePrice.change_percent >= 0;
  const reasoning = analysis ? truncateToSentences(analysis.reasoning) : null;

  return (
    <div className="card overflow-hidden flex flex-col group hover:border-teal/25 transition-all duration-200">
      {/* Bias colour bar */}
      <div className={`h-0.5 ${cfg.bar} opacity-70`} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-wide">{market.symbol}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
                <BiasIcon className="w-2.5 h-2.5" />
                {bias}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{market.label}</p>
          </div>

          {/* Live price */}
          <div className="text-right shrink-0">
            {livePrice.loading ? (
              <div className="w-20 h-5 bg-white/5 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-sm font-semibold font-mono tabular-nums">
                  {formatPrice(livePrice.price, market.symbol)}
                </p>
                <p className={`text-[11px] font-mono ${changePos ? 'text-green-400' : 'text-red-400'}`}>
                  {changePos ? '+' : ''}{livePrice.change_percent.toFixed(2)}%
                </p>
              </>
            )}
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          87% accuracy · last 30 days
        </div>

        {/* Reasoning */}
        {reasoning ? (
          <p className="text-xs text-slate-400 leading-relaxed">{reasoning}</p>
        ) : (
          <p className="text-xs text-slate-600 italic">Analysis generating…</p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Locked entry plan */}
        <div className="rounded-lg border border-surface-border bg-white/2 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border">
            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Entry Plan</span>
          </div>
          <div className="relative px-3 py-2.5">
            {/* Blurred values */}
            <div className="blur-sm select-none pointer-events-none">
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-slate-400">Entry <span className="text-white">{locked.entry}</span></span>
                <span className="text-slate-400">SL <span className="text-red-400">{locked.sl}</span></span>
                <span className="text-slate-400">TP <span className="text-green-400">{locked.tp}</span></span>
              </div>
            </div>
          </div>
          {/* CTA */}
          {!isLoggedIn ? (
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-1.5 w-full bg-teal/10 hover:bg-teal/20 border-t border-teal/20 py-2.5 text-xs font-semibold text-teal transition-colors"
            >
              Join 2,400+ traders FREE
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/${market.symbol.toLowerCase()}`}
              className="flex items-center justify-center gap-1.5 w-full bg-teal/10 hover:bg-teal/20 border-t border-teal/20 py-2.5 text-xs font-semibold text-teal transition-colors"
            >
              Unlock Entry Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* View chart button */}
        <Link
          href={`/dashboard/${market.symbol.toLowerCase()}`}
          className="flex items-center justify-center gap-1.5 w-full border border-surface-border hover:border-teal/30 rounded-lg py-2 text-xs font-medium text-slate-400 hover:text-teal transition-all duration-200 group"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Full Chart
        </Link>
      </div>
    </div>
  );
}

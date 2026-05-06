'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Lock, ArrowRight } from 'lucide-react';
import { SparklineChart } from './SparklineChart';
import { formatPrice } from '@/lib/markets';
import type { DailyAnalysis, LivePriceData, MarketSymbol } from '@/types';

interface HeroCardProps {
  market: MarketSymbol;
  analysis: DailyAnalysis | null;
  livePrice: LivePriceData;
  sparkline: number[];
  isLoggedIn: boolean;
}

const BIAS = {
  Bullish: {
    bar: 'bg-green-500',
    badge: 'bg-green-500/15 text-green-400 border-green-500/25',
    glow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]',
    icon: TrendingUp,
  },
  Bearish: {
    bar: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    glow: 'hover:shadow-[0_0_40px_rgba(239,68,68,0.12)]',
    icon: TrendingDown,
  },
  Neutral: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    glow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    icon: Minus,
  },
};

function truncate2(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 2).join(' ').trim() || text.slice(0, 220);
}

export function HeroCard({ market, analysis, livePrice, sparkline, isLoggedIn }: HeroCardProps) {
  const bias = analysis?.bias ?? 'Neutral';
  const cfg = BIAS[bias];
  const BiasIcon = cfg.icon;
  const pos = livePrice.change_percent >= 0;

  const locked = (() => {
    const z = analysis?.entry_zones?.[0];
    if (!z) return { entry: '—', sl: '—', tp: '—' };
    return {
      entry: formatPrice(z.entry, market.symbol),
      sl: formatPrice(z.stop_loss, market.symbol),
      tp: formatPrice(z.take_profit[0] ?? z.entry, market.symbol),
    };
  })();

  return (
    <div
      className={`card flex flex-col overflow-hidden group transition-all duration-300 hover:border-white/10 ${cfg.glow}`}
    >
      {/* Bias bar */}
      <div className={`h-0.5 ${cfg.bar} opacity-60`} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-base tracking-wide">{market.symbol}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${cfg.badge}`}>
                <BiasIcon className="w-2.5 h-2.5" />
                {bias}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{market.label}</p>
          </div>

          {/* Sparkline */}
          <SparklineChart points={sparkline} width={88} height={32} />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2.5">
          {livePrice.loading ? (
            <div className="h-8 w-36 bg-white/5 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-2xl font-bold font-mono tabular-nums tracking-tight">
                {formatPrice(livePrice.price, market.symbol)}
              </span>
              <span className={`text-sm font-semibold ${pos ? 'text-green-400' : 'text-red-400'}`}>
                {pos ? '+' : ''}{livePrice.change_percent.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.bar} opacity-80`} />
          87% accuracy · last 30 days
        </div>

        {/* Reasoning */}
        <p className="text-xs text-slate-400 leading-relaxed flex-1">
          {analysis ? truncate2(analysis.reasoning) : (
            <span className="italic text-slate-600">Analysis generating after 06:00 UTC…</span>
          )}
        </p>

        {/* Locked entry */}
        <div className="rounded-lg border border-surface-border bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border">
            <Lock className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Entry Plan
            </span>
          </div>
          <div className="px-3 py-2.5 blur-sm select-none pointer-events-none">
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-slate-500">Entry <span className="text-white">{locked.entry}</span></span>
              <span className="text-slate-500">SL <span className="text-red-400">{locked.sl}</span></span>
              <span className="text-slate-500">TP <span className="text-green-400">{locked.tp}</span></span>
            </div>
          </div>
          {!isLoggedIn ? (
            <Link
              href="/auth/signup"
              className="flex items-center justify-center gap-1.5 w-full bg-teal/10 hover:bg-teal/20 border-t border-teal/20 py-2.5 text-xs font-bold text-teal transition-colors"
            >
              Join 2,400+ traders FREE
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/${market.symbol.toLowerCase()}`}
              className="flex items-center justify-center gap-1.5 w-full bg-teal/10 hover:bg-teal/20 border-t border-teal/20 py-2.5 text-xs font-bold text-teal transition-colors"
            >
              Unlock Entry Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* View chart */}
        <Link
          href={`/dashboard/${market.symbol.toLowerCase()}`}
          className="flex items-center justify-center gap-1.5 w-full border border-surface-border hover:border-white/15 rounded-lg py-2 text-xs font-medium text-slate-500 hover:text-white transition-all duration-200"
        >
          View Full Chart →
        </Link>
      </div>
    </div>
  );
}

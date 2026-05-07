'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Lock, ChevronDown, ArrowRight, Zap } from 'lucide-react';
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
    bar: 'bg-green-500',
    dot: 'bg-green-400',
    label: 'BUY TODAY',
    icon: TrendingUp,
    border: 'border-l-green-500/50',
  },
  Bearish: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    bar: 'bg-red-500',
    dot: 'bg-red-400',
    label: 'SELL TODAY',
    icon: TrendingDown,
    border: 'border-l-red-500/50',
  },
  Neutral: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    bar: 'bg-amber-500',
    dot: 'bg-amber-400',
    label: 'WATCH',
    icon: Minus,
    border: 'border-l-amber-500/40',
  },
};

// Rough confidence score derived from reasoning length + bias strength
function getConfidence(analysis: DailyAnalysis | null): number {
  if (!analysis) return 0;
  const base = analysis.bias === 'Neutral' ? 55 : 72;
  const bonus = Math.min(analysis.entry_zones.length * 5, 15);
  const levelBonus = Math.min(analysis.key_levels.length * 3, 12);
  return Math.min(base + bonus + levelBonus, 96);
}

interface ExpandedRowProps {
  analysis: DailyAnalysis;
  market: MarketSymbol;
  canSeeEntries: boolean;
  isLoggedIn: boolean;
}

function ExpandedRow({ analysis, market, canSeeEntries, isLoggedIn }: ExpandedRowProps) {
  const bias = analysis.bias;
  const cfg = BIAS_CONFIG[bias];

  return (
    <div
      className="overflow-hidden transition-all duration-200"
      style={{ maxHeight: '500px' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-surface-border/50 bg-white/[0.015]">
        {/* Col 1: Summary + Key Levels */}
        <div className="px-5 py-4 border-b md:border-b-0 md:border-r border-surface-border/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Analysis</p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{analysis.reasoning}</p>
          {analysis.key_levels.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Key Levels</p>
              <div className="space-y-1.5">
                {analysis.key_levels.slice(0, 4).map((level, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{level.label}</span>
                    <span className={`text-[10px] font-mono font-semibold ${
                      level.type === 'support' ? 'text-green-400' :
                      level.type === 'resistance' ? 'text-red-400' : 'text-amber-400'
                    }`}>{formatPrice(level.price, market.symbol)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Col 2: Scenarios + Avoid */}
        <div className="px-5 py-4 border-b md:border-b-0 md:border-r border-surface-border/40">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Bull Case</p>
          <div className="flex items-start gap-1.5 mb-3">
            <TrendingUp className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {bias === 'Bullish'
                ? `Price holds above key support and continues momentum toward resistance targets.`
                : `A break above resistance signals trend reversal — watch for confirmation.`}
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Bear Case</p>
          <div className="flex items-start gap-1.5 mb-3">
            <TrendingDown className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {bias === 'Bearish'
                ? `Price fails to reclaim support — further downside likely toward lower targets.`
                : `Failure to hold current levels opens downside to next support zone.`}
            </p>
          </div>
          {analysis.invalidation_points.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Invalidation</p>
              {analysis.invalidation_points.slice(0, 2).map((pt, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <span className="text-[10px] text-amber-400 font-mono shrink-0">{formatPrice(pt.price, market.symbol)}</span>
                  <span className="text-[10px] text-slate-500">{pt.condition}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Col 3: Entry Plans */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Entry Plans</p>
          {canSeeEntries ? (
            <div className="space-y-2">
              {analysis.entry_zones.slice(0, 3).map((zone, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.05] transition-all ${
                    i >= 2 && !canSeeEntries ? 'blur-sm select-none pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-bold ${zone.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                      {zone.direction.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">@ {formatPrice(zone.entry, market.symbol)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div>
                      <p className="text-slate-600">SL</p>
                      <p className="text-red-400 font-mono">{formatPrice(zone.stop_loss, market.symbol)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">TP</p>
                      <p className="text-green-400 font-mono">{formatPrice(zone.take_profit[0] ?? 0, market.symbol)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[100px] gap-2">
              <Lock className="w-4 h-4 text-teal/60" />
              <Link
                href="/auth/signup"
                className="text-[11px] font-bold text-teal hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Unlock FREE →
              </Link>
              <p className="text-[10px] text-slate-600 text-center">Entry · SL · TP for all signals</p>
            </div>
          )}
          <Link
            href={`/dashboard/${market.symbol.toLowerCase()}`}
            className="flex items-center gap-1 mt-3 text-[10px] text-teal/70 hover:text-teal transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Full analysis <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface Props {
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  markets: MarketSymbol[];
  isLoggedIn: boolean;
  isVerified: boolean;
}

export function TopSignalsTable({ analyses, prices, markets, isLoggedIn, isVerified }: Props) {
  const canSeeEntries = isLoggedIn && isVerified;
  const [expanded, setExpanded] = useState<string | null>(null);

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
        {!canSeeEntries && (
          <Link
            href="/auth/signup"
            className="ml-auto flex items-center gap-1 text-[10px] font-bold text-teal hover:text-white transition-colors"
          >
            <Lock className="w-3 h-3" />
            Unlock FREE →
          </Link>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-surface-border/60">
        {rows.map(({ market, analysis, price }) => {
          const bias = analysis?.bias ?? 'Neutral';
          const cfg = BIAS_CONFIG[bias];
          const BiasIcon = cfg.icon;
          const changePos = (price?.change_percent ?? 0) >= 0;
          const confidence = getConfidence(analysis);
          const isOpen = expanded === market.symbol;

          return (
            <div key={market.symbol} className={`border-l-2 ${cfg.border}`}>
              {/* Collapsed row — clickable */}
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : market.symbol)}
              >
                {/* Flag + name */}
                <span className="text-lg w-8 text-center shrink-0">{FLAGS[market.symbol] ?? '💱'}</span>
                <div className="min-w-[80px] shrink-0">
                  <p className="text-sm font-bold text-slate-100">{market.symbol}</p>
                  <p className="text-[10px] text-slate-600 hidden sm:block">{market.label}</p>
                </div>

                {/* Bias badge */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold border shrink-0 ${cfg.badge}`}>
                  <BiasIcon className="w-3 h-3" />
                  {cfg.label}
                </div>

                {/* Reasoning snippet */}
                {analysis?.reasoning && (
                  <p className="hidden lg:block flex-1 text-[11px] text-slate-500 leading-snug line-clamp-2 text-left">
                    {analysis.reasoning}
                  </p>
                )}
                {!analysis && (
                  <div className="hidden lg:flex flex-1 items-center gap-1.5 text-[11px] text-slate-600">
                    <Zap className="w-3 h-3 text-slate-700" />
                    Analysis runs daily at 06:00 UTC
                  </div>
                )}

                {/* Confidence bar */}
                {analysis && (
                  <div className="hidden xl:flex flex-col gap-0.5 w-[60px] shrink-0">
                    <span className="text-[9px] text-slate-600">Confidence</span>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bar} opacity-80`} style={{ width: `${confidence}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{confidence}%</span>
                  </div>
                )}

                {/* Price */}
                <div className="ml-auto text-right shrink-0">
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

                {/* Chevron */}
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded panel */}
              {isOpen && analysis && (
                <ExpandedRow
                  analysis={analysis}
                  market={market}
                  canSeeEntries={canSeeEntries}
                  isLoggedIn={isLoggedIn}
                />
              )}
              {isOpen && !analysis && (
                <div className="px-5 py-4 border-t border-surface-border/50 bg-white/[0.015] text-xs text-slate-600">
                  No analysis generated yet today. Check back after 06:00 UTC.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

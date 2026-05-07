export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TradingViewWidget } from '@/components/market/TradingViewWidget';
import { SymbolSidebar } from '@/components/symbol/SymbolSidebar';
import { MARKET_SYMBOLS, formatPrice } from '@/lib/markets';
import type { DailyAnalysis } from '@/types';

interface Props {
  params: { symbol: string };
}

async function getAnalysis(symbol: string): Promise<DailyAnalysis | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_analyses')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .eq('date', today)
    .single();
  return data;
}

async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

const BIAS_CFG = {
  Bullish: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/25', bar: 'bg-green-500', barLight: 'bg-green-500/20' },
  Bearish: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/25', bar: 'bg-red-500', barLight: 'bg-red-500/20' },
  Neutral: { icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25', bar: 'bg-amber-500', barLight: 'bg-amber-500/20' },
};

function getConfidence(analysis: DailyAnalysis): number {
  const base = analysis.bias === 'Neutral' ? 55 : 72;
  const bonus = Math.min(analysis.entry_zones.length * 5, 15);
  const levelBonus = Math.min(analysis.key_levels.length * 3, 12);
  return Math.min(base + bonus + levelBonus, 96);
}

const TIMEFRAMES = ['1', '5', '15', '60', '240', 'D', 'W'];
const TF_LABELS: Record<string, string> = {
  '1': '1M', '5': '5M', '15': '15M', '60': '1H', '240': '4H', 'D': '1D', 'W': '1W',
};

export default async function SymbolPage({ params }: Props) {
  const symbolUpper = params.symbol.toUpperCase();
  const market = MARKET_SYMBOLS.find((m) => m.symbol === symbolUpper);
  if (!market) notFound();

  const [analysis, user] = await Promise.all([getAnalysis(symbolUpper), getUser()]);
  const isLoggedIn = !!user;
  const isVerified = user?.email_confirmed_at != null;
  const canSeeEntries = isLoggedIn && isVerified;

  const bias = analysis?.bias ?? 'Neutral';
  const cfg = BIAS_CFG[bias];
  const BiasIcon = cfg.icon;
  const confidence = analysis ? getConfidence(analysis) : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 pb-20 xl:pb-6">
      {/* ── Compact header bar ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Pair + label */}
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-lg font-bold tracking-tight">{market.symbol}</h1>
          <span className="text-xs text-slate-600 hidden sm:inline">{market.label}</span>
        </div>

        {/* Bias pill */}
        {analysis && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} shrink-0`}>
            <BiasIcon className="w-3.5 h-3.5" />
            {bias}
          </span>
        )}

        {/* Reasoning snippet */}
        {analysis?.reasoning && (
          <p className="hidden lg:block text-[11px] text-slate-500 leading-snug flex-1 line-clamp-1">
            {analysis.reasoning}
          </p>
        )}

        {/* Confidence bar */}
        {analysis && (
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
            <span className="text-[10px] text-slate-600">Confidence</span>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${cfg.bar} rounded-full opacity-80`} style={{ width: `${confidence}%` }} />
            </div>
            <span className="text-[10px] font-mono text-slate-400">{confidence}%</span>
          </div>
        )}

        {/* Analysis price */}
        {analysis?.price_at_analysis && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-slate-600">Analysis price</p>
            <p className="text-sm font-bold font-mono">{formatPrice(analysis.price_at_analysis, market.symbol)}</p>
          </div>
        )}
      </div>

      {/* ─── MAIN GRID: chart+analysis left, sidebar right ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[62fr_38fr] gap-4">

        {/* Left: chart + analysis panel */}
        <div className="space-y-4 min-w-0">
          {/* Chart card */}
          <div className="card overflow-hidden">
            {/* Timeframe buttons */}
            <div className="flex items-center gap-0.5 px-4 py-2.5 border-b border-surface-border">
              {TIMEFRAMES.map((tf) => (
                <span
                  key={tf}
                  className="px-2.5 py-1.5 rounded text-xs font-semibold text-slate-500 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  {TF_LABELS[tf]}
                </span>
              ))}
            </div>
            <TradingViewWidget symbol={market.tvSymbol} height={600} />
          </div>

          {/* Quick stats below chart */}
          {analysis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 mb-1">Bias</p>
                <p className={`text-sm font-bold ${cfg.color}`}>{bias}</p>
              </div>
              <div className="card px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 mb-1">Key Levels</p>
                <p className="text-sm font-bold text-slate-200">{analysis.key_levels.length}</p>
              </div>
              <div className="card px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 mb-1">Entry Zones</p>
                <p className="text-sm font-bold text-slate-200">{analysis.entry_zones.length}</p>
              </div>
              <div className="card px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 mb-1">Confidence</p>
                <p className={`text-sm font-bold ${cfg.color}`}>{confidence}%</p>
              </div>
            </div>
          )}

          {/* Analysis panel */}
          {analysis ? (
            <>
              {/* Reasoning */}
              <div className="card p-4">
                <div className={`h-0.5 ${cfg.bar} opacity-60 -mx-4 -mt-4 mb-4 rounded-t-xl`} />
                <p className="section-header mb-3">Market Analysis</p>
                <p className="text-sm text-slate-300 leading-relaxed">{analysis.reasoning}</p>
              </div>

              {/* Key levels */}
              {analysis.key_levels.length > 0 && (
                <div className="card p-4">
                  <p className="section-header mb-3">Key Levels</p>
                  <div className="space-y-2">
                    {analysis.key_levels.map((level, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-surface-border/50 last:border-0">
                        <span className="text-xs text-slate-400">{level.label}</span>
                        <span className={`text-xs font-mono font-semibold ${
                          level.type === 'support' ? 'text-green-400' :
                          level.type === 'resistance' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {formatPrice(level.price, market.symbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entry plans */}
              <div className="card p-4">
                <p className="section-header mb-3">Entry Plans</p>
                {canSeeEntries ? (
                  <div className="space-y-3">
                    {analysis.entry_zones.map((zone, i) => (
                      <div
                        key={i}
                        className={`bg-white/[0.04] rounded-xl p-3 space-y-2 relative overflow-hidden ${
                          i >= 2 ? 'select-none' : ''
                        }`}
                      >
                        {/* Blur overlay for entries 2+ */}
                        {i >= 2 && (
                          <div className="absolute inset-0 backdrop-blur-sm bg-navy-900/60 flex items-center justify-center z-10 rounded-xl">
                            <Link href="/auth/signup" className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/15 border border-teal/25 rounded-lg text-teal text-xs font-bold hover:bg-teal/25 transition-colors">
                              <Lock className="w-3 h-3" />
                              Unlock premium entry
                            </Link>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold flex items-center gap-1 ${zone.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                            {zone.direction === 'long' ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {zone.direction.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            @ {formatPrice(zone.entry, market.symbol)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-600 mb-0.5">Stop Loss</p>
                            <p className="text-red-400 font-mono font-semibold">{formatPrice(zone.stop_loss, market.symbol)}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 mb-0.5">Take Profit</p>
                            <p className="text-green-400 font-mono font-semibold">
                              {zone.take_profit.map((p) => formatPrice(p, market.symbol)).join(' / ')}
                            </p>
                          </div>
                        </div>
                        {zone.notes && (
                          <p className="text-[11px] text-slate-500 border-t border-white/5 pt-2">{zone.notes}</p>
                        )}
                      </div>
                    ))}

                    {analysis.invalidation_points.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-surface-border space-y-1.5">
                        <p className="section-header mb-2">Invalidation</p>
                        {analysis.invalidation_points.map((pt, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-amber-400 font-mono shrink-0">
                              {formatPrice(pt.price, market.symbol)}
                            </span>
                            <span className="text-slate-400">{pt.condition}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-teal/5 border border-teal/20 rounded-xl p-4">
                    <Lock className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-200 mb-1">Entry Plans Locked</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {!isLoggedIn ? (
                          <>
                            <Link href="/auth/signup" className="text-teal hover:underline font-medium">
                              Create a free account
                            </Link>{' '}
                            to unlock precision entry zones, stop losses, and take-profit targets.
                          </>
                        ) : (
                          'Please verify your email address to unlock entry plans.'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-slate-600 text-sm">
              No analysis for today yet.
              <br />
              <span className="text-xs text-slate-700">Check back after 06:00 UTC.</span>
            </div>
          )}
        </div>

        {/* Right: related news + community sidebar */}
        <div>
          <SymbolSidebar symbol={symbolUpper} />
        </div>
      </div>
    </div>
  );
}

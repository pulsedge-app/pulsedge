export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TradingViewWidget } from '@/components/market/TradingViewWidget';
import { MARKET_SYMBOLS } from '@/lib/markets';
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
  Bullish: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/25' },
  Bearish: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/25' },
  Neutral: { icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25' },
};

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 10) return price.toFixed(2);
  return price.toFixed(4);
}

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{market.symbol}</h1>
            {analysis && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                <BiasIcon className="w-3.5 h-3.5" />
                {bias}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">{market.label}</p>
        </div>
        {analysis?.price_at_analysis && (
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">Analysis price</p>
            <p className="text-lg font-semibold font-mono">{formatPrice(analysis.price_at_analysis)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart — spans 2 cols */}
        <div className="xl:col-span-2 card overflow-hidden">
          <TradingViewWidget symbol={market.tvSymbol} height={480} />
        </div>

        {/* Analysis panel */}
        <div className="space-y-4">
          {analysis ? (
            <>
              {/* Reasoning */}
              <div className="card p-4">
                <p className="section-header mb-3">Analysis</p>
                <p className="text-sm text-slate-300 leading-relaxed">{analysis.reasoning}</p>
              </div>

              {/* Key levels */}
              {analysis.key_levels.length > 0 && (
                <div className="card p-4">
                  <p className="section-header mb-3">Key Levels</p>
                  <div className="space-y-2">
                    {analysis.key_levels.map((level, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{level.label}</span>
                        <span
                          className={`text-xs font-mono font-medium ${
                            level.type === 'support'
                              ? 'text-green-400'
                              : level.type === 'resistance'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {formatPrice(level.price)}
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
                      <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold flex items-center gap-1 ${
                              zone.direction === 'long' ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {zone.direction === 'long' ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {zone.direction.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            @ {formatPrice(zone.entry)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500 mb-0.5">Stop Loss</p>
                            <p className="text-red-400 font-mono">{formatPrice(zone.stop_loss)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-0.5">Take Profit</p>
                            <p className="text-green-400 font-mono">
                              {zone.take_profit.map(formatPrice).join(' / ')}
                            </p>
                          </div>
                        </div>
                        {zone.notes && (
                          <p className="text-[11px] text-slate-500 border-t border-white/5 pt-2">
                            {zone.notes}
                          </p>
                        )}
                      </div>
                    ))}

                    {analysis.invalidation_points.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-surface-border space-y-1.5">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                          Invalidation
                        </p>
                        {analysis.invalidation_points.map((pt, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-amber-400 font-mono shrink-0">
                              {formatPrice(pt.price)}
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
                      <p className="text-sm font-medium text-slate-200 mb-1">Entry Plans Locked</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {!isLoggedIn ? (
                          <>
                            <Link href="/auth/signup" className="text-teal hover:underline">
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
            <div className="card p-8 text-center text-slate-500 text-sm">
              No analysis for today yet. Check back after 06:00 UTC.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

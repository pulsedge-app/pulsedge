'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Lock,
  Target,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import { BiasIndicator } from './BiasIndicator';
import type { DailyAnalysis } from '@/types';

interface AnalysisCardProps {
  analysis: DailyAnalysis;
  isLoggedIn: boolean;
}

export function AnalysisCard({ analysis, isLoggedIn }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatPrice = (p: number) =>
    p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });

  return (
    <div className="card overflow-hidden hover:border-teal/30 transition-colors">
      {/* Top bar */}
      <div
        className={`h-1 ${
          analysis.bias === 'Bullish'
            ? 'bg-gradient-to-r from-green-500/60 to-green-500/0'
            : analysis.bias === 'Bearish'
            ? 'bg-gradient-to-r from-red-500/60 to-red-500/0'
            : 'bg-gradient-to-r from-amber-500/60 to-amber-500/0'
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-base">{analysis.symbol}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {new Date(analysis.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {analysis.price_at_analysis && (
                <span className="ml-2 text-teal">@ {formatPrice(analysis.price_at_analysis)}</span>
              )}
            </p>
          </div>
          <BiasIndicator bias={analysis.bias} />
        </div>

        {/* Reasoning */}
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{analysis.reasoning}</p>

        {/* Key Levels */}
        {analysis.key_levels.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="section-header mb-0">Key Levels</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {analysis.key_levels.map((level, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                >
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

        {/* Entry Plans - gated */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-teal hover:text-teal-hover transition-colors mb-2.5"
          >
            <Target className="w-3.5 h-3.5" />
            Entry Plans
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {expanded && (
            <div className="animate-slide-up">
              {isLoggedIn ? (
                <div className="space-y-2">
                  {analysis.entry_zones.map((zone, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1 text-xs font-semibold ${
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
                          Entry: {formatPrice(zone.entry)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-slate-500">Stop Loss</span>
                          <p className="text-red-400 font-mono">{formatPrice(zone.stop_loss)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Take Profit</span>
                          <p className="text-green-400 font-mono">
                            {zone.take_profit.map(formatPrice).join(' / ')}
                          </p>
                        </div>
                      </div>
                      {zone.notes && (
                        <p className="text-xs text-slate-500 italic border-t border-white/5 pt-2">
                          {zone.notes}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Invalidation */}
                  {analysis.invalidation_points.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="section-header mb-0">Invalidation</span>
                      </div>
                      {analysis.invalidation_points.map((pt, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-400 mb-1"
                        >
                          <span className="text-amber-400 font-mono shrink-0">
                            {formatPrice(pt.price)}
                          </span>
                          <span>{pt.condition}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-teal/5 border border-teal/20 rounded-xl p-4">
                  <Lock className="w-5 h-5 text-teal shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Entry Plans Locked</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <a href="/auth/login" className="text-teal hover:underline">
                        Create a free account
                      </a>{' '}
                      to unlock precision entry zones, stop losses, and take-profit targets.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

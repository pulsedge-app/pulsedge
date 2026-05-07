'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { formatPrice } from '@/lib/markets';
import type { DailyAnalysis, MarketSymbol, LivePriceData } from '@/types';

const BIAS_CFG = {
  Bullish: { color: 'text-green-400', border: 'border-l-green-500/60', bg: 'bg-green-500/8', icon: TrendingUp, dot: 'bg-green-400' },
  Bearish: { color: 'text-red-400', border: 'border-l-red-500/60', bg: 'bg-red-500/8', icon: TrendingDown, dot: 'bg-red-400' },
  Neutral: { color: 'text-amber-400', border: 'border-l-amber-500/40', bg: 'bg-amber-500/5', icon: Minus, dot: 'bg-amber-400' },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  crypto: '₿',
  forex: '💱',
  stocks: '📈',
};

interface RowProps {
  market: MarketSymbol;
  analysis: DailyAnalysis | null;
  price: LivePriceData | undefined;
  blurred?: boolean;
}

function OpportunityRow({ market, analysis, price, blurred }: RowProps) {
  const bias = analysis?.bias ?? 'Neutral';
  const cfg = BIAS_CFG[bias];
  const BiasIcon = cfg.icon;
  const changePos = (price?.change_percent ?? 0) >= 0;

  return (
    <Link
      href={`/dashboard/${market.symbol.toLowerCase()}`}
      className={`flex items-center gap-3 px-4 py-2.5 border-l-2 ${cfg.border} hover:bg-white/[0.02] transition-colors group ${blurred ? 'pointer-events-none select-none' : ''}`}
      style={blurred ? { filter: 'blur(4px)', opacity: 0.5 } : {}}
      tabIndex={blurred ? -1 : undefined}
    >
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="text-xs font-bold text-slate-200 w-[72px] shrink-0">{market.symbol}</span>
      <BiasIcon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
      <span className={`text-[10px] font-bold ${cfg.color} flex-1`}>{bias.toUpperCase()}</span>
      <div className="text-right shrink-0">
        {price?.loading ? (
          <div className="h-3 w-14 bg-white/10 rounded animate-pulse" />
        ) : (
          <>
            <p className="text-[11px] font-mono text-slate-200">{formatPrice(price?.price ?? 0, market.symbol)}</p>
            <p className={`text-[9px] font-mono ${changePos ? 'text-green-400' : 'text-red-400'}`}>
              {changePos ? '+' : ''}{(price?.change_percent ?? 0).toFixed(2)}%
            </p>
          </>
        )}
      </div>
    </Link>
  );
}

interface SectionProps {
  label: string;
  emoji: string;
  markets: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  visibleCount?: number;
  isLoggedIn: boolean;
}

function CategorySection({ label, emoji, markets, analyses, prices, visibleCount, isLoggedIn }: SectionProps) {
  const visible = visibleCount !== undefined ? markets.slice(0, visibleCount) : markets;
  const locked = visibleCount !== undefined ? markets.slice(visibleCount) : [];

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-border/50">
        <span className="text-sm">{emoji}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="ml-auto text-[10px] text-slate-700">{markets.length} markets</span>
      </div>
      <div className="divide-y divide-surface-border/30">
        {visible.map((m) => (
          <OpportunityRow
            key={m.symbol}
            market={m}
            analysis={analyses[m.symbol] ?? null}
            price={prices[m.symbol]}
          />
        ))}
        {locked.length > 0 && (
          <div className="relative">
            {locked.slice(0, 3).map((m) => (
              <OpportunityRow
                key={m.symbol}
                market={m}
                analysis={analyses[m.symbol] ?? null}
                price={prices[m.symbol]}
                blurred
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-navy-900/60 to-navy-900/90">
              {!isLoggedIn && (
                <Link href="/auth/signup" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal/15 border border-teal/25 text-teal text-xs font-bold hover:bg-teal/25 transition-colors">
                  <Lock className="w-3 h-3" />
                  Unlock {locked.length} more
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  markets: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  isLoggedIn: boolean;
}

export function TopOpportunities({ markets, analyses, prices, isLoggedIn }: Props) {
  const crypto = markets.filter((m) => m.category === 'crypto');
  const forex = markets.filter((m) => m.category === 'forex');
  const stocks = markets.filter((m) => m.category === 'stocks');

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
        <span className="text-base">🏆</span>
        <h2 className="text-sm font-semibold">Top Opportunities</h2>
        <span className="text-[10px] text-slate-600 ml-1">AI-ranked · live</span>
      </div>

      <div className="divide-y divide-surface-border/50">
        <CategorySection
          label="Crypto"
          emoji={CATEGORY_EMOJIS.crypto}
          markets={crypto}
          analyses={analyses}
          prices={prices}
          isLoggedIn={isLoggedIn}
        />
        <CategorySection
          label="Forex"
          emoji={CATEGORY_EMOJIS.forex}
          markets={forex}
          analyses={analyses}
          prices={prices}
          isLoggedIn={isLoggedIn}
        />
        <CategorySection
          label="Stocks"
          emoji={CATEGORY_EMOJIS.stocks}
          markets={stocks}
          analyses={analyses}
          prices={prices}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}

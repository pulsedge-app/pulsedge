'use client';

import { MarketCard } from './MarketCard';
import type { DailyAnalysis, MarketSymbol, LivePriceData } from '@/types';

interface MarketSectionProps {
  title: string;
  icon: React.ReactNode;
  markets: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  prices: Record<string, LivePriceData>;
  isLoggedIn: boolean;
}

export function MarketSection({
  title,
  icon,
  markets,
  analyses,
  prices,
  isLoggedIn,
}: MarketSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-teal">{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </h2>
        <div className="flex-1 glow-line" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {markets.map((market) => (
          <MarketCard
            key={market.symbol}
            market={market}
            analysis={analyses[market.symbol] ?? null}
            livePrice={prices[market.symbol] ?? { price: 0, change_percent: 0, loading: true }}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </section>
  );
}

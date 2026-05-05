'use client';

import Link from 'next/link';
import { AlertCircle, Coins, TrendingUp, BarChart2 } from 'lucide-react';
import { MarketCard } from '@/components/market/MarketCard';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { useLivePrices } from '@/hooks/useLivePrices';
import { FOREX_SYMBOLS, CRYPTO_SYMBOLS, STOCK_SYMBOLS } from '@/lib/markets';
import type { DailyAnalysis, MarketSymbol } from '@/types';

interface Props {
  markets: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  isLoggedIn: boolean;
  isVerified: boolean;
  userEmail: string | null;
}

const SECTIONS = [
  { key: 'forex', label: 'Forex', icon: Coins, symbols: FOREX_SYMBOLS },
  { key: 'crypto', label: 'Crypto', icon: TrendingUp, symbols: CRYPTO_SYMBOLS },
  { key: 'stocks', label: 'Stocks', icon: BarChart2, symbols: STOCK_SYMBOLS },
];

function MarketSection({
  label,
  icon: Icon,
  symbols,
  analyses,
  prices,
  isLoggedIn,
}: {
  label: string;
  icon: React.ElementType;
  symbols: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  prices: ReturnType<typeof useLivePrices>;
  isLoggedIn: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-3.5 h-3.5 text-teal" />
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-teal/20 to-transparent" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {symbols.map((market) => (
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

export function DashboardClient({ markets, analyses, isLoggedIn, isVerified, userEmail }: Props) {
  const prices = useLivePrices(markets);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left panel */}
      <LeftPanel />

      {/* Centre */}
      <div className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-24 lg:pb-6 space-y-8">
        {/* Email verification banner */}
        {isLoggedIn && !isVerified && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-amber-300">Verify your email</span>
              <span className="text-amber-400/80 ml-1">
                to unlock entry plans and community posting. Check{' '}
                <span className="font-mono text-amber-300">{userEmail}</span>.
              </span>
            </div>
          </div>
        )}

        {/* Section: Forex */}
        {SECTIONS.map(({ key, label, icon, symbols }) => (
          <MarketSection
            key={key}
            label={label}
            icon={icon}
            symbols={symbols}
            analyses={analyses}
            prices={prices}
            isLoggedIn={isLoggedIn}
          />
        ))}

        {/* Mobile: community feed below cards */}
        <div className="lg:hidden" id="community">
          <CommunityFeed />
        </div>
      </div>

      {/* Right panel — community feed (desktop) */}
      <div className="hidden lg:flex flex-col w-[320px] shrink-0 border-l border-surface-border">
        <CommunityFeed />
      </div>
    </div>
  );
}

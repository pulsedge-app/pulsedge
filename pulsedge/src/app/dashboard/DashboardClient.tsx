'use client';

import { AlertCircle } from 'lucide-react';
import { TopSignalsTable } from '@/components/market/TopSignalsTable';
import { AllMarketsTable } from '@/components/market/AllMarketsTable';
import { EconomicCalendar } from '@/components/calendar/EconomicCalendar';
import { IntelPanel } from '@/components/news/IntelPanel';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { NextEventBox } from '@/components/dashboard/NextEventBox';
import { TopOpportunities } from '@/components/dashboard/TopOpportunities';
import { BottomNewsStrip } from '@/components/dashboard/BottomNewsStrip';
import { useLivePrices } from '@/hooks/useLivePrices';
import type { DailyAnalysis, MarketSymbol } from '@/types';

interface Props {
  markets: MarketSymbol[];
  analyses: Record<string, DailyAnalysis | null>;
  heroSparklines: Record<string, number[]>;
  isLoggedIn: boolean;
  isVerified: boolean;
  userEmail: string | null;
}

export function DashboardClient({
  markets,
  analyses,
  isLoggedIn,
  isVerified,
  userEmail,
}: Props) {
  const prices = useLivePrices(markets);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-20 xl:pb-8">
      {/* Email verification banner */}
      {isLoggedIn && !isVerified && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-amber-300">Verify your email</span>
            <span className="text-amber-400/80 ml-1.5">
              to unlock entry plans and community posting. Check{' '}
              <span className="font-mono text-amber-300">{userEmail}</span>
            </span>
          </div>
        </div>
      )}

      {/* ─── TWO-COLUMN LAYOUT ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[62fr_38fr] gap-4">

        {/* ── LEFT COLUMN (62%) ── */}
        <div className="space-y-4 min-w-0">
          {/* Today's Top Signals */}
          <TopSignalsTable
            analyses={analyses}
            prices={prices}
            markets={markets}
            isLoggedIn={isLoggedIn}
            isVerified={isVerified}
          />

          {/* All Markets table */}
          <AllMarketsTable
            markets={markets}
            analyses={analyses}
            prices={prices}
            isLoggedIn={isLoggedIn}
          />

          {/* Top Opportunities */}
          <TopOpportunities
            markets={markets}
            analyses={analyses}
            prices={prices}
            isLoggedIn={isLoggedIn}
          />

          {/* Economic Calendar */}
          <div id="calendar">
            <EconomicCalendar />
          </div>

          {/* Bottom News Strip */}
          <BottomNewsStrip />

          {/* Mobile-only: right column panels rendered below */}
          <div className="xl:hidden space-y-4" id="community">
            <NextEventBox />
            <IntelPanel />
            <div className="card overflow-hidden" style={{ minHeight: '480px' }}>
              <CommunityFeed />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (38%) — sticky, three panels ── */}
        <div
          id="news"
          className="hidden xl:flex flex-col gap-3 sticky top-[88px] self-start"
          style={{ height: 'calc(100vh - 88px - 1.5rem)', minHeight: 0 }}
        >
          {/* Next High-Impact Event */}
          <div className="shrink-0">
            <NextEventBox />
          </div>

          {/* Intel Panel — upper ~40% */}
          <div
            className="card overflow-hidden flex flex-col shrink-0"
            style={{ maxHeight: '40%', minHeight: 0 }}
          >
            <div className="overflow-y-auto flex-1 min-h-0">
              <IntelPanel compact />
            </div>
          </div>

          {/* Community Feed — fills remaining height */}
          <div className="card overflow-hidden flex flex-col flex-1 min-h-0" id="community">
            <CommunityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

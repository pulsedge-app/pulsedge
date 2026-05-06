'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { HeroCard } from '@/components/market/HeroCard';
import { PairTable } from '@/components/market/PairTable';
import { TopStoryBox } from '@/components/news/TopStoryBox';
import { NextEventBox } from '@/components/news/NextEventBox';
import { MarketIntelFeed } from '@/components/news/MarketIntelFeed';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { useLivePrices } from '@/hooks/useLivePrices';
import { MARKET_SYMBOLS, HERO_SYMBOLS } from '@/lib/markets';
import type { DailyAnalysis, MarketSymbol, CalendarEvent, NewsItem } from '@/types';

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
  heroSparklines,
  isLoggedIn,
  isVerified,
  userEmail,
}: Props) {
  const prices = useLivePrices(markets);

  // News state — fetched here and shared with TopStory + Feed
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsUpdated, setNewsUpdated] = useState<Date | null>(null);

  // Calendar events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data: NewsItem[] = await res.json();
        setNews(data);
        setNewsUpdated(new Date());
      }
    } catch {
      // keep previous
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // Initial fetches
  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchNews]);

  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((data: CalendarEvent[]) => setCalendarEvents(data))
      .catch(() => {});
    const id = setInterval(() => {
      fetch('/api/calendar')
        .then((r) => r.json())
        .then((data: CalendarEvent[]) => setCalendarEvents(data))
        .catch(() => {});
    }, 60 * 60_000);
    return () => clearInterval(id);
  }, []);

  const heroMarkets = HERO_SYMBOLS.map((s) => MARKET_SYMBOLS.find((m) => m.symbol === s)!).filter(Boolean);
  const topStory = news.find((n) => n.relevanceScore >= 9) ?? news[0] ?? null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 space-y-8">
      {/* Email verification banner */}
      {isLoggedIn && !isVerified && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
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

      {/* ─── SECTION 1: HERO CARDS ─── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-teal text-xs font-bold uppercase tracking-widest">Featured</span>
          <div className="flex-1 glow-line" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {heroMarkets.map((market) => (
            <HeroCard
              key={market.symbol}
              market={market}
              analysis={analyses[market.symbol] ?? null}
              livePrice={prices[market.symbol] ?? { price: 0, change_percent: 0, loading: true }}
              sparkline={heroSparklines[market.tdSymbol] ?? []}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      </section>

      {/* ─── SECTION 2: PAIR TABLE ─── */}
      <section id="markets">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-teal text-xs font-bold uppercase tracking-widest">All Markets</span>
          <div className="flex-1 glow-line" />
        </div>
        <PairTable analyses={analyses} prices={prices} isLoggedIn={isLoggedIn} />
      </section>

      {/* ─── SECTION 3: TWO COLUMN LAYOUT ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6" id="news">
        {/* Left column — 60% */}
        <div className="space-y-5">
          <TopStoryBox story={topStory} />
          <NextEventBox events={calendarEvents} />
          <MarketIntelFeed
            items={news}
            loading={newsLoading}
            onRefresh={fetchNews}
            lastUpdated={newsUpdated}
          />
        </div>

        {/* Right column — 40% */}
        <div
          id="community"
          className="xl:sticky xl:top-[5.5rem] xl:self-start card overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 7rem)' }}
        >
          <CommunityFeed />
        </div>
      </div>
    </div>
  );
}

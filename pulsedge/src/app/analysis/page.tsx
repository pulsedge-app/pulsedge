export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { MARKET_SYMBOLS } from '@/lib/markets';
import type { DailyAnalysis } from '@/types';
import { CalendarDays, Sparkles } from 'lucide-react';

async function getRecentAnalyses(): Promise<DailyAnalysis[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('daily_analyses')
    .select('*')
    .order('date', { ascending: false })
    .order('symbol', { ascending: true })
    .limit(44);

  return data ?? [];
}

async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export default async function AnalysisPage() {
  const [analyses, user] = await Promise.all([getRecentAnalyses(), getUser()]);
  const isLoggedIn = !!user;

  const byDate: Record<string, DailyAnalysis[]> = {};
  analyses.forEach((a) => {
    if (!byDate[a.date]) byDate[a.date] = [];
    byDate[a.date].push(a);
  });

  const symbolOrder = MARKET_SYMBOLS.map((m) => m.symbol);
  Object.keys(byDate).forEach((date) => {
    byDate[date].sort(
      (a, b) => symbolOrder.indexOf(a.symbol) - symbolOrder.indexOf(b.symbol)
    );
  });

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-teal" />
          <h1 className="text-2xl font-bold">Daily Analysis</h1>
        </div>
        <p className="text-slate-400 text-sm max-w-2xl">
          AI-generated institutional bias, key levels, and entry plans for all tracked
          instruments. Analysis is published at 06:00 UTC each trading day.
          {!isLoggedIn && (
            <span className="text-slate-500">
              {' '}
              <a href="/auth/signup" className="text-teal hover:underline">
                Create a free account
              </a>{' '}
              to unlock entry plans.
            </span>
          )}
        </p>
      </div>

      {dates.length === 0 ? (
        <div className="card p-16 text-center">
          <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No analyses yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Analysis will be generated at 06:00 UTC each day.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-6">
                <CalendarDays className="w-4 h-4 text-teal" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
                <div className="flex-1 glow-line" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {byDate[date].map((analysis) => (
                  <AnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

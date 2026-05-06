export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';
import { MARKET_SYMBOLS, HERO_SYMBOLS } from '@/lib/markets';
import { getSparklinePoints } from '@/lib/twelve-data';
import type { DailyAnalysis } from '@/types';

async function getAnalyses(): Promise<Record<string, DailyAnalysis | null>> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_analyses')
    .select('*')
    .eq('date', today);
  const bySymbol: Record<string, DailyAnalysis | null> = {};
  (data ?? []).forEach((a: DailyAnalysis) => { bySymbol[a.symbol] = a; });
  return bySymbol;
}

async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function getHeroSparklines(): Promise<Record<string, number[]>> {
  const heroes = MARKET_SYMBOLS.filter((m) => HERO_SYMBOLS.includes(m.symbol));
  const results = await Promise.all(
    heroes.map(async (m) => ({
      key: m.tdSymbol,
      points: await getSparklinePoints(m.tdSymbol, '1h', 8),
    }))
  );
  return Object.fromEntries(results.map((r) => [r.key, r.points]));
}

export default async function DashboardPage() {
  const [analyses, user, heroSparklines] = await Promise.all([
    getAnalyses(),
    getUser(),
    getHeroSparklines(),
  ]);

  return (
    <DashboardClient
      markets={MARKET_SYMBOLS}
      analyses={analyses}
      heroSparklines={heroSparklines}
      isLoggedIn={!!user}
      isVerified={user?.email_confirmed_at != null}
      userEmail={user?.email ?? null}
    />
  );
}

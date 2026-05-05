export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';
import { MARKET_SYMBOLS } from '@/lib/markets';
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

export default async function DashboardPage() {
  const [analyses, user] = await Promise.all([getAnalyses(), getUser()]);
  const isLoggedIn = !!user;
  const isVerified = user?.email_confirmed_at != null;

  return (
    <DashboardClient
      markets={MARKET_SYMBOLS}
      analyses={analyses}
      isLoggedIn={isLoggedIn}
      isVerified={isVerified}
      userEmail={user?.email ?? null}
    />
  );
}

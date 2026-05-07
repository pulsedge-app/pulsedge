'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronDown, CheckCircle, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/types';

type ImpactFilter = 'ALL' | 'High' | 'Medium' | 'Low';

const IMPACT_DOT: Record<string, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-400',
  Low: 'bg-slate-600',
};
const IMPACT_LABEL: Record<string, string> = { High: 'HIGH', Medium: 'MED', Low: 'LOW' };
const IMPACT_COLOR: Record<string, string> = {
  High: 'text-red-400', Medium: 'text-amber-400', Low: 'text-slate-500',
};

const COUNTRY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', NZD: '🇳🇿', CNY: '🇨🇳',
};

const HIGH_PAIRS: Record<string, string[]> = {
  USD: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
  EUR: ['EURUSD', 'EURGBP'],
  GBP: ['GBPUSD', 'EURGBP'],
  JPY: ['USDJPY', 'GBPJPY'],
  AUD: ['AUDUSD'],
  CAD: ['USDCAD'],
  CHF: ['USDCHF'],
  NZD: ['NZDUSD'],
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'NOW';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatDayHeader(dateStr: string, todayStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = dayNames[d.getDay()];
  const label = `${dayName} ${monthNames[d.getMonth()]} ${d.getDate()}`;
  return dateStr === todayStr ? `${label} · Today` : label;
}

function compareActualVsForecast(actual: string, forecast: string): 'beat' | 'miss' | null {
  if (!actual || !forecast) return null;
  const a = parseFloat(actual.replace(/[^0-9.-]/g, ''));
  const f = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
  if (isNaN(a) || isNaN(f)) return null;
  if (a > f) return 'beat';
  if (a < f) return 'miss';
  return null;
}

export function EconomicCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<ImpactFilter>('ALL');
  const [hours, setHours] = useState(48);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [dayOffset, setDayOffset] = useState(0);

  const fetchEvents = async (h: number) => {
    setLoading(true);
    setFetchFailed(false);
    try {
      const res = await fetch(`/api/calendar?hours=${h}`);
      if (res.ok) {
        setEvents(await res.json());
      } else {
        setFetchFailed(true);
      }
    } catch {
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(hours); }, [hours]);

  // 1s countdown tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayStr = now.toISOString().split('T')[0];

  const filtered = useMemo(
    () => filter === 'ALL' ? events : events.filter((e) => e.impact === filter),
    [events, filter]
  );

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filtered) {
      const key = ev.date || ev.datetime.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Displayed groups based on dayOffset
  const displayedGroups = useMemo(() => {
    if (grouped.length === 0) return [];
    const allDates = grouped.map(([d]) => d);
    const todayIdx = allDates.indexOf(todayStr);
    const startIdx = Math.max(0, (todayIdx === -1 ? 0 : todayIdx) + dayOffset);
    return grouped.slice(startIdx, startIdx + 2);
  }, [grouped, todayStr, dayOffset]);

  // Find next upcoming HIGH event
  const nextHigh = useMemo(() => {
    return events.find(
      (e) => e.impact === 'High' && new Date(e.datetime).getTime() > now.getTime()
    ) ?? null;
  }, [events, now]);

  const noHighIn24h = useMemo(() => {
    const cutoff = now.getTime() + 24 * 60 * 60 * 1000;
    return events.length > 0 && !events.some(
      (e) => e.impact === 'High' && new Date(e.datetime).getTime() < cutoff
    );
  }, [events, now]);

  const FILTERS: ImpactFilter[] = ['ALL', 'High', 'Medium', 'Low'];

  const canGoBack = dayOffset > 0;
  const canGoForward = displayedGroups.length > 0;

  return (
    <div className="card overflow-hidden" id="calendar">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
        <span className="text-base">📅</span>
        <h2 className="text-sm font-semibold">Economic Calendar</h2>
        <div className="flex items-center gap-1 ml-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                filter === f ? 'bg-teal/15 text-teal border border-teal/25' : 'text-slate-600 hover:text-slate-300'
              }`}>
              {f === 'ALL' ? 'ALL' : IMPACT_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Day navigation */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
            disabled={!canGoBack}
            className="p-1 rounded text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDayOffset((d) => d + 1)}
            disabled={!canGoForward}
            className="p-1 rounded text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => fetchEvents(hours)} disabled={loading}
            className="ml-1 text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Clear-skies banner */}
      {noHighIn24h && (
        <div className="flex items-center gap-2 px-5 py-2 bg-green-500/10 border-b border-green-500/20 text-xs text-green-400">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Clear skies — no high-impact events in the next 24h</span>
        </div>
      )}

      {/* Events */}
      <div className="divide-y divide-surface-border/40">
        {loading && events.length === 0 ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white/10 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/8 rounded w-2/3" />
                <div className="h-2.5 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : fetchFailed ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-500">📅 Calendar loading…</p>
            <p className="text-xs text-slate-600 mt-1">ForexFactory updates hourly — check back shortly.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-600">
            {filter !== 'ALL'
              ? `No ${IMPACT_LABEL[filter]} impact events in the next ${hours}h.`
              : `No events in the next ${hours} hours.`}
          </div>
        ) : (
          (dayOffset === 0 && displayedGroups.length === 0 ? grouped : displayedGroups).map(([dateStr, dayEvents]) => (
            <div key={dateStr}>
              {/* Day header */}
              <div className="flex items-center gap-2 px-5 py-2 bg-white/[0.02] border-b border-surface-border/30">
                <span className="text-[11px] font-bold text-slate-400">
                  {formatDayHeader(dateStr, todayStr)}
                </span>
                <span className="text-[10px] text-slate-700">{dayEvents.length} events</span>
              </div>

              {/* Events for this day */}
              {dayEvents.map((event, i) => {
                const eventMs = new Date(event.datetime).getTime();
                const msUntil = eventMs - now.getTime();
                const isPast = msUntil < -60_000;
                const isImminent = msUntil > 0 && msUntil < 30 * 60 * 1000;
                const isNextHigh = nextHigh?.datetime === event.datetime && nextHigh?.title === event.title;
                const flag = COUNTRY_FLAGS[event.currency] ?? event.currency;
                const actualResult = compareActualVsForecast(event.actual, event.forecast);

                return (
                  <div key={i}
                    className={`flex items-start gap-3 px-5 py-3 transition-colors ${
                      isPast ? 'opacity-40' : isImminent ? 'bg-amber-500/5' : 'hover:bg-white/[0.015]'
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${IMPACT_DOT[event.impact] ?? 'bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            {isNextHigh && !isPast && (
                              <span className="text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full animate-pulse">
                                UP NEXT
                              </span>
                            )}
                            <p className="text-xs font-medium text-slate-200 leading-snug">{event.title}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-600">{event.time} UTC</span>
                            <span className="text-sm leading-none">{flag}</span>
                            <span className={`text-[9px] font-bold uppercase ${IMPACT_COLOR[event.impact]}`}>
                              {event.currency} · {IMPACT_LABEL[event.impact] ?? event.impact}
                            </span>
                            {event.forecast && (
                              <span className="text-[10px] text-slate-600">
                                F: <span className="text-slate-400">{event.forecast}</span>
                              </span>
                            )}
                            {event.actual && (
                              <span className={`text-[10px] font-bold ${
                                actualResult === 'beat' ? 'text-green-400' :
                                actualResult === 'miss' ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                A: {event.actual}
                                {actualResult === 'beat' && ' ↑'}
                                {actualResult === 'miss' && ' ↓'}
                              </span>
                            )}
                            {event.previous && (
                              <span className="text-[10px] text-slate-700">
                                P: {event.previous}
                              </span>
                            )}
                          </div>
                          {/* Pulse AI context for HIGH impact */}
                          {event.impact === 'High' && !isPast && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-teal/60">
                              <Zap className="w-3 h-3 shrink-0" />
                              <span>
                                Watch {(HIGH_PAIRS[event.currency] ?? [event.currency]).slice(0, 3).join(', ')} — volatility expected
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {isPast ? (
                            <span className="text-[10px] text-slate-700">Done</span>
                          ) : (
                            <span className={`text-[10px] font-mono font-bold ${isImminent ? 'text-amber-400' : 'text-slate-500'}`}>
                              {formatCountdown(msUntil)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Show 24h / 48h toggle */}
      {!loading && !fetchFailed && (
        <div className="px-5 py-2.5 border-t border-surface-border/50 flex justify-center">
          <button onClick={() => setHours((h) => h === 24 ? 48 : 24)}
            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hours === 48 ? 'rotate-180' : ''}`} />
            {hours === 24 ? 'Show next 48 hours' : 'Show 24 hours only'}
          </button>
        </div>
      )}
    </div>
  );
}

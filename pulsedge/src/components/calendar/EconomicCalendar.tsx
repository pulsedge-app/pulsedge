'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronDown, CheckCircle } from 'lucide-react';
import type { CalendarEvent } from '@/types';

type ImpactFilter = 'ALL' | 'High' | 'Medium' | 'Low';

const IMPACT_DOT: Record<string, string> = {
  High: 'bg-red-500',
  Medium: 'bg-amber-400',
  Low: 'bg-slate-600',
};

const IMPACT_LABEL: Record<string, string> = {
  High: 'HIGH',
  Medium: 'MED',
  Low: 'LOW',
};

const IMPACT_COLOR: Record<string, string> = {
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-slate-500',
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

interface Props {
  initialEvents?: CalendarEvent[];
}

export function EconomicCalendar({ initialEvents = [] }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [filter, setFilter] = useState<ImpactFilter>('ALL');
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [now, setNow] = useState(() => new Date());

  // Fetch events
  const fetchEvents = async (h: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?hours=${h}`);
      if (res.ok) setEvents(await res.json());
    } catch {/* keep previous */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(hours); }, [hours]);

  // Live countdown ticker
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(
    () => filter === 'ALL' ? events : events.filter((e) => e.impact === filter),
    [events, filter]
  );

  // Check if no HIGH events in next 12 hours
  const noHighIn12h = useMemo(() => {
    const cutoff = now.getTime() + 12 * 60 * 60 * 1000;
    return !events.some(
      (e) => e.impact === 'High' && new Date(e.datetime).getTime() < cutoff
    );
  }, [events, now]);

  const FILTERS: ImpactFilter[] = ['ALL', 'High', 'Medium', 'Low'];

  return (
    <div className="card overflow-hidden" id="calendar">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
        <span className="text-base">📅</span>
        <h2 className="text-sm font-semibold">Economic Calendar</h2>
        <div className="flex items-center gap-1 ml-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                filter === f
                  ? 'bg-teal/15 text-teal border border-teal/25'
                  : 'text-slate-600 hover:text-slate-300'
              }`}
            >
              {f === 'ALL' ? 'ALL' : IMPACT_LABEL[f]}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchEvents(hours)}
          disabled={loading}
          className="ml-auto text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Green banner: clear window */}
      {noHighIn12h && events.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2 bg-green-500/10 border-b border-green-500/20 text-xs text-green-400">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>No high-impact events in the next 12 hours — clean trading window</span>
        </div>
      )}

      {/* Events list */}
      <div className="divide-y divide-surface-border/40">
        {loading && events.length === 0 ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white/10 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/8 rounded w-2/3" />
                <div className="h-2.5 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-600">
            No {filter !== 'ALL' ? filter.toLowerCase() + '-impact ' : ''}events in the next {hours} hours.
          </div>
        ) : (
          filtered.map((event, i) => {
            const eventMs = new Date(event.datetime).getTime();
            const msUntil = eventMs - now.getTime();
            const isPast = msUntil < -60_000;
            const isImminent = msUntil > 0 && msUntil < 30 * 60 * 1000;

            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-5 py-3 transition-colors ${
                  isPast ? 'opacity-40' : isImminent ? 'bg-amber-500/5' : 'hover:bg-white/[0.015]'
                }`}
              >
                {/* Impact dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${IMPACT_DOT[event.impact] ?? 'bg-slate-600'}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-200 leading-snug">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-600 font-mono">{event.time} UTC</span>
                        <span className={`text-[9px] font-bold uppercase ${IMPACT_COLOR[event.impact]}`}>
                          {event.currency}
                        </span>
                        {event.forecast && (
                          <span className="text-[10px] text-slate-600">
                            F: <span className="text-slate-400">{event.forecast}</span>
                          </span>
                        )}
                        {event.actual && (
                          <span className="text-[10px] text-green-400 font-bold">
                            A: {event.actual}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Countdown */}
                    <div className={`text-right shrink-0 ${isImminent ? 'text-amber-400' : 'text-slate-600'}`}>
                      {isPast ? (
                        <span className="text-[10px]">Done</span>
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
          })
        )}
      </div>

      {/* Show more / less */}
      {!loading && (
        <div className="px-5 py-2.5 border-t border-surface-border/50 flex justify-center">
          <button
            onClick={() => setHours((h) => h === 24 ? 48 : 24)}
            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hours === 48 ? 'rotate-180' : ''}`} />
            {hours === 24 ? 'Show next 48 hours' : 'Show 24 hours only'}
          </button>
        </div>
      )}
    </div>
  );
}

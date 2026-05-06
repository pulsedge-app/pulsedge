'use client';

import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface Props {
  events: CalendarEvent[];
}

function useCountdown(targetIso: string) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const tick = () => setDiff(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return { h, m, s, pad, isPast: diff === 0 };
}

const IMPACT_COLOR: Record<string, string> = {
  High: 'text-red-400 border-red-500/25 bg-red-500/10',
  Medium: 'text-amber-400 border-amber-500/25 bg-amber-500/10',
  Low: 'text-slate-400 border-slate-500/25 bg-slate-500/10',
};

function EventCountdown({ event }: { event: CalendarEvent }) {
  const { h, m, s, pad, isPast } = useCountdown(event.datetime);

  return (
    <div className="card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-teal" />
        <span className="section-header">Next High Impact Event</span>
      </div>

      {/* Event */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm text-white leading-tight">{event.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-slate-500">{event.currency}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${IMPACT_COLOR[event.impact]}`}
            >
              {event.impact} Impact
            </span>
          </div>
        </div>

        {/* Countdown */}
        {isPast ? (
          <span className="text-xs text-slate-500 shrink-0">Released</span>
        ) : (
          <div className="shrink-0 text-right">
            <div className="font-mono text-xl font-bold text-white tabular-nums">
              {h > 0 && `${pad(h)}:`}{pad(m)}:{pad(s)}
            </div>
            <p className="text-[10px] text-slate-600">until release</p>
          </div>
        )}
      </div>

      {/* Previous / Forecast */}
      {(event.previous || event.forecast) && (
        <div className="flex gap-6 pt-2 border-t border-surface-border">
          {event.previous && (
            <div>
              <p className="text-[10px] text-slate-600 mb-0.5">Previous</p>
              <p className="text-xs font-mono font-medium text-slate-300">{event.previous}</p>
            </div>
          )}
          {event.forecast && (
            <div>
              <p className="text-[10px] text-slate-600 mb-0.5">Forecast</p>
              <p className="text-xs font-mono font-medium text-teal">{event.forecast}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-teal" />
        <span className="section-header">Upcoming High Impact Events</span>
      </div>
      <div className="space-y-3">
        {events.slice(0, 3).map((ev, i) => {
          const t = new Date(ev.datetime);
          const timeStr = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
          const dateStr = t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
          return (
            <div key={i} className="flex items-start justify-between gap-3 text-xs">
              <div>
                <p className="text-slate-200 font-medium">{ev.title}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{ev.currency} · {dateStr}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-slate-300">{timeStr} UTC</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${IMPACT_COLOR[ev.impact]}`}>
                  {ev.impact}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NextEventBox({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-teal" />
          <span className="section-header">Next High Impact Event</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 py-4">
          <Zap className="w-4 h-4" />
          No high impact events in the next 24 hours
        </div>
      </div>
    );
  }

  // Show live countdown if event is within 12 hours
  const first = events[0];
  const hoursUntil = (new Date(first.datetime).getTime() - Date.now()) / (1000 * 3600);

  if (hoursUntil <= 12) {
    return <EventCountdown event={first} />;
  }

  return <UpcomingEvents events={events} />;
}

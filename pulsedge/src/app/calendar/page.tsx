export const dynamic = 'force-dynamic';
import { CalendarEventRow } from '@/components/calendar/CalendarEvent';
import type { CalendarEvent } from '@/types';
import { Calendar, AlertTriangle, RefreshCw } from 'lucide-react';

async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/calendar`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function groupByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });
  return groups;
}

export default async function CalendarPage() {
  const events = await getCalendarEvents();
  const grouped = groupByDate(events);
  const dates = Object.keys(grouped).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-teal" />
            <h1 className="text-2xl font-bold">Economic Calendar</h1>
          </div>
          <p className="text-slate-400 text-sm">
            High-impact events only — the ones that move markets.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Updated hourly</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          High impact
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Medium impact
        </span>
      </div>

      {dates.length === 0 ? (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No upcoming events</p>
          <p className="text-slate-500 text-sm mt-1">
            Check back later or verify the ForexFactory feed is accessible.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-teal" />
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <div className="card overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-b border-surface-border bg-white/2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="w-20">Time</div>
                  <div className="w-12">CCY</div>
                  <div className="w-6" />
                  <div className="flex-1">Event</div>
                  <div className="w-64 flex gap-4">
                    <span className="flex-1 text-center">Actual</span>
                    <span className="flex-1 text-center">Forecast</span>
                    <span className="flex-1 text-center">Previous</span>
                  </div>
                </div>
                {grouped[date].map((event, i) => (
                  <CalendarEventRow key={i} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

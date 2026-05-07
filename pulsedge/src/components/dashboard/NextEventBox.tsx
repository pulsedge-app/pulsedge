'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import type { CalendarEvent } from '@/types';

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

const COUNTRY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', NZD: '🇳🇿', CNY: '🇨🇳',
};

export function NextEventBox() {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetch('/api/calendar?hours=48')
      .then((r) => r.ok ? r.json() : [])
      .then((events: CalendarEvent[]) => {
        const upcoming = events
          .filter((e) => e.impact === 'High' && new Date(e.datetime).getTime() > Date.now())
          .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        setEvent(upcoming[0] ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!event) return null;

  const ms = new Date(event.datetime).getTime() - now.getTime();
  const isImminent = ms > 0 && ms < 30 * 60 * 1000;
  const flag = COUNTRY_FLAGS[event.currency] ?? event.currency;

  return (
    <div className={`card px-4 py-3 border ${isImminent ? 'border-amber-500/30 bg-amber-500/5' : 'border-surface-border'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            isImminent
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/25 animate-pulse'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {isImminent ? '⚡ IMMINENT' : '🔴 NEXT HIGH'}
          </span>
          <span className="text-sm">{flag}</span>
          <p className="text-xs font-medium text-slate-200 truncate">{event.title}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-bold font-mono ${isImminent ? 'text-amber-400' : 'text-slate-300'}`}>
            {formatCountdown(ms)}
          </p>
          <p className="text-[9px] text-slate-600">{event.time} UTC</p>
        </div>
      </div>
      {event.forecast && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-600">
          <span>Forecast: <span className="text-slate-400 font-mono">{event.forecast}</span></span>
          {event.previous && <span>Prev: <span className="text-slate-400 font-mono">{event.previous}</span></span>}
          <span className="ml-auto flex items-center gap-1 text-teal/70">
            <Zap className="w-3 h-3" />
            Watch {event.currency} pairs closely
          </span>
        </div>
      )}
    </div>
  );
}

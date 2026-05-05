import type { CalendarEvent } from '@/types';
import { AlertTriangle, Clock } from 'lucide-react';

interface CalendarEventProps {
  event: CalendarEvent;
}

const COUNTRY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  NZD: '🇳🇿',
  CNY: '🇨🇳',
};

export function CalendarEventRow({ event }: CalendarEventProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-surface-border last:border-0 hover:bg-white/2 px-4 transition-colors">
      {/* Time */}
      <div className="w-20 shrink-0">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {event.time}
        </div>
      </div>

      {/* Country */}
      <div className="w-12 shrink-0 text-center">
        <span className="text-base" title={event.country}>
          {COUNTRY_FLAGS[event.country] ?? event.country}
        </span>
      </div>

      {/* Impact */}
      <div className="w-6 shrink-0 flex justify-center">
        <AlertTriangle
          className={`w-4 h-4 ${
            event.impact === 'High'
              ? 'text-red-400'
              : event.impact === 'Medium'
              ? 'text-amber-400'
              : 'text-slate-600'
          }`}
        />
      </div>

      {/* Event name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.title}</p>
      </div>

      {/* Forecast / Previous / Actual */}
      <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
        {event.actual && (
          <div className="text-center">
            <p className="text-slate-500">Actual</p>
            <p
              className={`font-mono font-medium ${
                event.actual && event.forecast
                  ? parseFloat(event.actual) >= parseFloat(event.forecast)
                    ? 'text-green-400'
                    : 'text-red-400'
                  : 'text-slate-300'
              }`}
            >
              {event.actual}
            </p>
          </div>
        )}
        {event.forecast && (
          <div className="text-center">
            <p className="text-slate-500">Forecast</p>
            <p className="font-mono text-slate-300">{event.forecast}</p>
          </div>
        )}
        {event.previous && (
          <div className="text-center">
            <p className="text-slate-500">Previous</p>
            <p className="font-mono text-slate-400">{event.previous}</p>
          </div>
        )}
      </div>
    </div>
  );
}

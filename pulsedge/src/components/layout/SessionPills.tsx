'use client';

import { useState, useEffect } from 'react';
import { getSessionStatuses, formatMinutes } from '@/lib/sessions';

export function SessionPills() {
  const [sessions, setSessions] = useState(() => getSessionStatuses());

  useEffect(() => {
    const id = setInterval(() => setSessions(getSessionStatuses()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-1.5">
      {sessions.map((s) => (
        <div
          key={s.name}
          title={
            s.isLive
              ? `${s.name} session — closes in ${formatMinutes(s.minutesUntilClose!)}`
              : `${s.name} session — opens in ${formatMinutes(s.minutesUntilOpen!)}`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
            s.isLive
              ? 'bg-green-500/10 border-green-500/25 text-green-400'
              : 'bg-white/[0.03] border-white/[0.08] text-slate-600'
          }`}
        >
          <span>{s.flag}</span>
          <span className="hidden lg:inline font-semibold">{s.name}</span>
          {s.isLive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-teal shrink-0" />
              <span className="text-green-500/70 hidden xl:inline">
                {formatMinutes(s.minutesUntilClose!)}
              </span>
            </>
          ) : (
            <span className="text-slate-700 hidden xl:inline">
              {formatMinutes(s.minutesUntilOpen!)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

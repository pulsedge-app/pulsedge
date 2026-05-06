'use client';

import { useState, useEffect } from 'react';
import { getSessionStatuses, formatMinutes } from '@/lib/sessions';

export function SessionPills() {
  const [sessions, setSessions] = useState(() => getSessionStatuses());

  useEffect(() => {
    const id = setInterval(() => setSessions(getSessionStatuses()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-1.5">
      {sessions.map((s) => (
        <div
          key={s.name}
          title={
            s.isLive
              ? `${s.name} — closes in ${formatMinutes(s.minutesUntilClose!)}`
              : `${s.name} — opens in ${formatMinutes(s.minutesUntilOpen!)}`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all select-none ${
            s.isLive
              ? 'bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.35)]'
              : 'bg-slate-800/80 text-slate-600 border border-white/[0.06]'
          }`}
        >
          <span>{s.flag}</span>
          <span className="hidden lg:inline">{s.name}</span>
          {s.isLive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
              <span className="hidden xl:inline opacity-90">
                {formatMinutes(s.minutesUntilClose!)} left
              </span>
            </>
          ) : (
            <span className="hidden xl:inline text-slate-700">
              {formatMinutes(s.minutesUntilOpen!)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

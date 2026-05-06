export type SessionName = 'Asian' | 'London' | 'New York';

export interface SessionStatus {
  name: SessionName;
  flag: string;
  startHour: number;
  endHour: number;
  isLive: boolean;
  minutesUntilOpen?: number;
  minutesUntilClose?: number;
}

const SESSIONS: Array<{ name: SessionName; flag: string; startHour: number; endHour: number }> = [
  { name: 'Asian', flag: '🌏', startHour: 0, endHour: 9 },
  { name: 'London', flag: '🇬🇧', startHour: 7, endHour: 16 },
  { name: 'New York', flag: '🇺🇸', startHour: 12, endHour: 21 },
];

export function getSessionStatuses(now: Date = new Date()): SessionStatus[] {
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const totalMinutes = utcHour * 60 + utcMinute;

  return SESSIONS.map(({ name, flag, startHour, endHour }) => {
    const startMin = startHour * 60;
    const endMin = endHour * 60;
    const isLive = totalMinutes >= startMin && totalMinutes < endMin;

    if (isLive) {
      return { name, flag, startHour, endHour, isLive: true, minutesUntilClose: endMin - totalMinutes };
    }
    let minsUntilOpen = startMin - totalMinutes;
    if (minsUntilOpen < 0) minsUntilOpen += 24 * 60;
    return { name, flag, startHour, endHour, isLive: false, minutesUntilOpen: minsUntilOpen };
  });
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

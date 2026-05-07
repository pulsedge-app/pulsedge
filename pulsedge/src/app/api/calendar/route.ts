import { NextRequest, NextResponse } from 'next/server';
import type { CalendarEvent } from '@/types';

const FF_JSON_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const FF_RSS_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';

// ─── JSON parser (preferred) ──────────────────────────────────────────────────

interface FFJsonEvent {
  title: string;
  country: string;
  date: string;   // "01-06-2025" MM-DD-YYYY
  time: string;   // "8:30am" ET  |  "All Day"  |  "Tentative"
  impact: string; // "High" | "Medium" | "Low" | "Holiday"
  forecast: string;
  previous: string;
  url?: string;
}

/** Determine UTC offset for Eastern Time — simple DST approximation */
function etOffsetHours(date: Date): number {
  // DST: second Sunday March → first Sunday November
  const y = date.getFullYear();
  const dstStart = new Date(y, 2, 8 - new Date(y, 2, 1).getDay()); // 2nd Sun Mar
  const dstEnd   = new Date(y, 10, 1 - new Date(y, 10, 1).getDay() + 1); // 1st Sun Nov
  return date >= dstStart && date < dstEnd ? -4 : -5;
}

function parseFFDateTime(dateStr: string, timeStr: string): string {
  try {
    // dateStr: MM-DD-YYYY
    const [mm, dd, yyyy] = dateStr.split('-').map(Number);
    const cleanTime = timeStr.trim().toLowerCase();

    // All Day / Tentative → midnight ET
    if (!cleanTime || cleanTime === 'all day' || cleanTime === 'tentative') {
      const d = new Date(Date.UTC(yyyy, mm - 1, dd, 4, 0)); // midnight ET≈UTC-4
      return d.toISOString();
    }

    // Parse "8:30am" / "12:00pm"
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (!match) throw new Error('unrecognised time');
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const ampm = match[3];
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    // Build a local-ET date to determine DST offset
    const localApprox = new Date(yyyy, mm - 1, dd, hour, minute);
    const offsetHours = etOffsetHours(localApprox);
    const utcHour = hour - offsetHours; // ET → UTC (subtract negative = add)

    const utc = new Date(Date.UTC(yyyy, mm - 1, dd, utcHour, minute));
    return utc.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function fetchJSON(hours: number): Promise<CalendarEvent[] | null> {
  try {
    const res = await fetch(FF_JSON_URL, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Pulsedge/1.0' },
    });
    if (!res.ok) return null;

    const raw: FFJsonEvent[] = await res.json();
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return raw
      .filter((e) => e.impact !== 'Holiday' && e.title && e.date)
      .map((e): CalendarEvent => {
        const datetime = parseFFDateTime(e.date, e.time);
        const d = new Date(datetime);
        return {
          title: e.title,
          country: e.country,
          currency: e.country,
          datetime,
          date: d.toISOString().split('T')[0],
          time: d.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
          }),
          impact: (e.impact as CalendarEvent['impact']) ?? 'Low',
          forecast: e.forecast ?? '',
          previous: e.previous ?? '',
          actual: '',
        };
      })
      .filter((e) => {
        const t = new Date(e.datetime).getTime();
        return t > now.getTime() - 60_000 && new Date(e.datetime) <= cutoff;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  } catch {
    return null;
  }
}

// ─── XML fallback ─────────────────────────────────────────────────────────────

function parseXmlValue(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`)
  );
  return (match?.[1] ?? match?.[2] ?? '').trim();
}

function extractItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  return items;
}

async function fetchXML(hours: number): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(FF_RSS_URL, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Pulsedge/1.0' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = extractItems(xml);
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return items
      .map((item) => {
        const impact = parseXmlValue(item, 'impact') as CalendarEvent['impact'];
        const pubDate = parseXmlValue(item, 'pubDate') || parseXmlValue(item, 'date');
        const d = new Date(pubDate);
        return {
          title: parseXmlValue(item, 'title'),
          country: parseXmlValue(item, 'country'),
          currency: parseXmlValue(item, 'country'),
          datetime: d.toISOString(),
          date: d.toISOString().split('T')[0],
          time: d.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
          }),
          impact,
          forecast: parseXmlValue(item, 'forecast'),
          previous: parseXmlValue(item, 'previous'),
          actual: parseXmlValue(item, 'actual'),
        } satisfies CalendarEvent;
      })
      .filter((e) => e.title && e.date)
      .filter((e) => {
        const t = new Date(e.datetime).getTime();
        return t > now.getTime() - 60_000 && new Date(e.datetime) <= cutoff;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  } catch {
    return [];
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const hoursParam = req.nextUrl.searchParams.get('hours');
  const hours = Math.min(48, Math.max(1, parseInt(hoursParam ?? '48', 10) || 48));

  // Try JSON first, fall back to XML
  const jsonEvents = await fetchJSON(hours);
  if (jsonEvents !== null) {
    return NextResponse.json(jsonEvents);
  }

  const xmlEvents = await fetchXML(hours);
  return NextResponse.json(xmlEvents);
}

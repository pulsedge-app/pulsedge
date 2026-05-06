import { NextResponse } from 'next/server';
import type { CalendarEvent } from '@/types';

const FF_RSS_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';

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

function parseDate(dateStr: string): { datetime: string; date: string; time: string } {
  try {
    const d = new Date(dateStr);
    return {
      datetime: d.toISOString(),
      date: d.toISOString().split('T')[0],
      time: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      }),
    };
  } catch {
    return { datetime: dateStr, date: dateStr, time: '' };
  }
}

export async function GET() {
  try {
    const res = await fetch(FF_RSS_URL, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Pulsedge/1.0' },
    });

    if (!res.ok) return NextResponse.json([]);

    const xml = await res.text();
    const items = extractItems(xml);
    const now = new Date();

    const events: CalendarEvent[] = items
      .map((item) => {
        const impact = parseXmlValue(item, 'impact') as CalendarEvent['impact'];
        const pubDate = parseXmlValue(item, 'pubDate') || parseXmlValue(item, 'date');
        const { datetime, date, time } = parseDate(pubDate);
        const country = parseXmlValue(item, 'country');

        return {
          title: parseXmlValue(item, 'title'),
          country,
          currency: country, // FF uses country code as currency indicator
          datetime,
          date,
          time,
          impact,
          forecast: parseXmlValue(item, 'forecast'),
          previous: parseXmlValue(item, 'previous'),
          actual: parseXmlValue(item, 'actual'),
        } satisfies CalendarEvent;
      })
      .filter((e) => e.impact === 'High' && e.title && e.date)
      // Return events from now onward, up to 24 hours
      .filter((e) => {
        const t = new Date(e.datetime).getTime();
        const diff = t - now.getTime();
        return diff > -60_000 && diff < 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    return NextResponse.json(events);
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return NextResponse.json([]);
  }
}

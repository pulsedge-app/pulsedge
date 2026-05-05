import { NextResponse } from 'next/server';
import type { CalendarEvent } from '@/types';

const FF_RSS_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';

function parseXmlValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`));
  if (!match) return '';
  return (match[1] ?? match[2] ?? '').trim();
}

function extractItems(xml: string): string[] {
  const items: string[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function parseDate(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    return {
      date: d.toISOString().split('T')[0],
      time: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      }),
    };
  } catch {
    return { date: dateStr, time: '' };
  }
}

export async function GET() {
  try {
    const res = await fetch(FF_RSS_URL, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Pulsedge/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const xml = await res.text();
    const items = extractItems(xml);

    const events: CalendarEvent[] = items
      .map((item) => {
        const impact = parseXmlValue(item, 'impact') as CalendarEvent['impact'];
        const pubDate = parseXmlValue(item, 'pubDate') || parseXmlValue(item, 'date');
        const { date, time } = parseDate(pubDate);

        return {
          title: parseXmlValue(item, 'title'),
          country: parseXmlValue(item, 'country'),
          date,
          time,
          impact,
          forecast: parseXmlValue(item, 'forecast'),
          previous: parseXmlValue(item, 'previous'),
          actual: parseXmlValue(item, 'actual'),
        } satisfies CalendarEvent;
      })
      .filter((e) => e.impact === 'High' && e.title && e.date);

    return NextResponse.json(events);
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return NextResponse.json([]);
  }
}

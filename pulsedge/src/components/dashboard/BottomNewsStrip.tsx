'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Zap, RefreshCw } from 'lucide-react';
import type { NewsItem } from '@/types';

const IMPACT_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-slate-600',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsListItem({ item }: { item: NewsItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-start gap-2.5 px-4 py-2.5 border-b border-surface-border/40 last:border-0 hover:bg-white/[0.02] transition-colors group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${IMPACT_DOT[item.impact] ?? 'bg-slate-600'}`} />
      <div className="flex-1 min-w-0">
        <a
          href={item.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[11px] font-medium text-slate-300 hover:text-white leading-snug transition-colors line-clamp-2"
        >
          {item.headline}
          <ExternalLink className="inline w-2.5 h-2.5 ml-1 text-slate-600 -mt-0.5" />
        </a>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {item.affectedPairs.slice(0, 3).map((p) => (
            <span key={p} className="text-[9px] font-bold text-teal/70">{p}</span>
          ))}
          <span className="text-[9px] text-slate-700">{timeAgo(item.publishedAt)}</span>
        </div>
      </div>

      {/* Hover tooltip: AI context */}
      {hovered && item.aiContext && (
        <div className="absolute left-4 right-4 bottom-full mb-1.5 z-20 bg-[#111827] border border-teal/20 rounded-lg px-3 py-2 shadow-xl">
          <div className="flex items-start gap-1.5">
            <Zap className="w-3 h-3 text-teal shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-snug">{item.aiContext}</p>
          </div>
          <div className="absolute left-5 top-full w-2 h-2 bg-[#111827] border-r border-b border-teal/20 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

function FeaturedStory({ item }: { item: NewsItem }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-navy-900 to-[#0d1629] border-l border-surface-border">
      <div className="px-4 pt-3 pb-2 border-b border-surface-border/40">
        <span className="text-[9px] font-bold uppercase tracking-widest text-teal/80">TOP STORY</span>
      </div>
      <div className="flex-1 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${IMPACT_DOT[item.impact] ?? 'bg-slate-600'}`} />
          <span className={`text-[9px] font-bold uppercase ${
            item.impact === 'HIGH' ? 'text-red-400' : item.impact === 'MEDIUM' ? 'text-amber-400' : 'text-slate-500'
          }`}>{item.impact} IMPACT</span>
        </div>
        <a
          href={item.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-semibold text-slate-100 leading-snug hover:text-white transition-colors"
        >
          {item.headline}
        </a>
        <div className="flex flex-wrap gap-1.5">
          {item.affectedPairs.slice(0, 4).map((p) => (
            <span key={p} className="px-1.5 py-0.5 rounded bg-teal/8 border border-teal/15 text-teal text-[9px] font-bold">
              {p}
            </span>
          ))}
        </div>
        {item.aiContext && (
          <div className="flex items-start gap-1.5 bg-white/[0.03] rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">{item.aiContext}</p>
          </div>
        )}
        <p className="text-[10px] text-slate-700">{item.source} · {timeAgo(item.publishedAt)}</p>
      </div>
    </div>
  );
}

export function BottomNewsStrip() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      if (res.ok) setItems(await res.json());
    } catch {/* keep previous */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchNews]);

  if (loading && items.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
          <span className="text-base">📡</span>
          <h2 className="text-sm font-semibold">Market Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr]">
          <div className="divide-y divide-surface-border/40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-2.5 px-4 py-2.5 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white/10 mt-1 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/8 rounded w-full" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const listItems = items.slice(0, 8);
  const featured = items[0];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
        <span className="text-base">📡</span>
        <h2 className="text-sm font-semibold">Market Intelligence</h2>
        <span className="text-[10px] text-slate-600 ml-1">Pulse AI · live scoring</span>
        <button
          onClick={fetchNews}
          className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Refresh news"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr]">
        {/* Left: list */}
        <div className="divide-y divide-surface-border/40">
          {listItems.map((item) => (
            <NewsListItem key={item.id} item={item} />
          ))}
        </div>
        {/* Right: featured */}
        <FeaturedStory item={featured} />
      </div>
    </div>
  );
}

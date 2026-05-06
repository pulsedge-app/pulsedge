'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Zap, RefreshCw, ChevronDown } from 'lucide-react';
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

function NewsRow({ item, featured }: { item: NewsItem; featured?: boolean }) {
  return (
    <div className={`group ${featured ? 'pb-4 mb-1' : 'py-3 border-b border-surface-border/50 last:border-0'}`}>
      {featured && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-teal/15 border border-teal/25 text-teal text-[9px] font-bold uppercase tracking-widest">
            Top Story
          </span>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPACT_DOT[item.impact]}`} />
        </div>
      )}

      <div className="flex items-start gap-3">
        {!featured && (
          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${IMPACT_DOT[item.impact]}`} />
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <a
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`block font-medium text-slate-200 hover:text-white leading-snug group-hover:text-white transition-colors ${
              featured ? 'text-sm' : 'text-xs'
            }`}
          >
            {item.headline}
            <ExternalLink className="inline w-2.5 h-2.5 ml-1 text-slate-600 -mt-0.5" />
          </a>

          <div className="flex items-center gap-2 flex-wrap">
            {item.affectedPairs.slice(0, 3).map((p) => (
              <span
                key={p}
                className="px-1.5 py-0.5 rounded bg-teal/8 border border-teal/15 text-teal text-[9px] font-bold"
              >
                {p}
              </span>
            ))}
            <span className="text-[10px] text-slate-600">
              {item.source} · {timeAgo(item.publishedAt)}
            </span>
          </div>

          {item.aiContext && (
            <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
              <Zap className="w-3 h-3 text-teal/60 shrink-0 mt-0.5" />
              <span>{item.aiContext}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="py-3 border-b border-surface-border/60 animate-pulse last:border-0">
      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full bg-white/10 mt-1.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/8 rounded w-full" />
          <div className="h-3 bg-white/6 rounded w-2/3" />
          <div className="h-2.5 bg-white/4 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

interface Props {
  /** If provided, renders as a compact embeddable panel (no sticky header chrome) */
  compact?: boolean;
}

export function IntelPanel({ compact = false }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        setItems(await res.json());
        setLastUpdated(new Date());
      }
    } catch {/* keep previous */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchNews]);

  const topStory = items.find((n) => n.relevanceScore >= 9) ?? items[0] ?? null;
  const rest = items.filter((n) => n !== topStory);
  const visible = showAll ? rest : rest.slice(0, 7);

  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <div className={compact ? '' : 'card overflow-hidden'}>
      {/* Header */}
      <div className={`flex items-center gap-2 border-b border-surface-border ${compact ? 'px-4 py-3' : 'px-5 py-3.5'}`}>
        <span className="text-base">📰</span>
        <h2 className="text-sm font-semibold">Market Intelligence</h2>
        <span className="text-[10px] text-slate-600">by Pulse AI</span>
        <div className="ml-auto flex items-center gap-2">
          {updatedStr && <span className="text-[10px] text-slate-700">Updated {updatedStr}</span>}
          <button
            onClick={fetchNews}
            disabled={loading}
            className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40"
            aria-label="Refresh news"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={compact ? 'px-4 py-3' : 'px-5 py-4'}>
        {loading && items.length === 0 ? (
          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-600">No relevant news at the moment.</div>
        ) : (
          <>
            {/* Top story */}
            {topStory && (
              <div className="mb-3 pb-3 border-b border-surface-border">
                <NewsRow item={topStory} featured />
              </div>
            )}

            {/* Rest */}
            <div>
              {visible.map((item) => (
                <NewsRow key={item.id} item={item} />
              ))}
            </div>

            {/* Load more */}
            {rest.length > 7 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors w-full justify-center py-1"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? 'Show less' : `Load ${rest.length - 7} more stories`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

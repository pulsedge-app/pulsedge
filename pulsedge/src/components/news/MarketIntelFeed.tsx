'use client';

import { ExternalLink, Zap, RefreshCw } from 'lucide-react';
import type { NewsItem } from '@/types';

interface Props {
  items: NewsItem[];
  loading: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const IMPACT_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-slate-600',
};

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <div className="py-3 border-b border-surface-border/60 last:border-0 group">
      <div className="flex items-start gap-3">
        {/* Impact dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${IMPACT_DOT[item.impact]}`} />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Headline */}
          <a
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-medium text-slate-200 hover:text-white leading-snug group-hover:text-white transition-colors"
          >
            {item.headline}
            <ExternalLink className="inline w-2.5 h-2.5 ml-1 text-slate-600 -mt-0.5" />
          </a>

          {/* Pairs + meta */}
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

          {/* AI context */}
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
    <div className="py-3 border-b border-surface-border/60 animate-pulse">
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

export function MarketIntelFeed({ items, loading, onRefresh, lastUpdated }: Props) {
  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
        <span className="text-base">📰</span>
        <h2 className="text-sm font-semibold">Market Intelligence</h2>
        <span className="text-[10px] text-slate-600">Curated by Pulse AI</span>
        <div className="ml-auto flex items-center gap-2">
          {updatedStr && <span className="text-[10px] text-slate-700">Updated {updatedStr}</span>}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40"
            aria-label="Refresh news"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-5">
        {loading && items.length === 0
          ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
          : items.length === 0
          ? (
            <div className="py-10 text-center text-sm text-slate-600">
              No relevant news at the moment.
            </div>
          )
          : items.map((item) => <NewsRow key={item.id} item={item} />)
        }
      </div>
    </div>
  );
}

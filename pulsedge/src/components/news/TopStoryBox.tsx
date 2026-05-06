'use client';

import { ExternalLink, MessageSquare, Zap } from 'lucide-react';
import type { NewsItem } from '@/types';

interface Props {
  story: NewsItem | null;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const IMPACT_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-slate-500',
};

export function TopStoryBox({ story }: Props) {
  if (!story) {
    return (
      <div className="card p-5 space-y-3 animate-pulse">
        <div className="h-3 w-32 bg-white/5 rounded" />
        <div className="h-5 w-full bg-white/5 rounded" />
        <div className="h-5 w-3/4 bg-white/5 rounded" />
        <div className="h-3 w-48 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-3 hover:border-white/10 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${IMPACT_DOT[story.impact]}`} />
        <span className="section-header">Top Story</span>
        <span className="ml-auto text-[10px] text-slate-600">
          {story.source} · {timeAgo(story.publishedAt)}
        </span>
      </div>

      {/* Headline */}
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm font-semibold text-slate-100 hover:text-white leading-snug group"
      >
        {story.headline}
        <ExternalLink className="inline w-3 h-3 ml-1.5 text-slate-600 group-hover:text-slate-400 -mt-0.5" />
      </a>

      {/* Affected pairs */}
      {story.affectedPairs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {story.affectedPairs.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded bg-teal/10 border border-teal/20 text-teal text-[10px] font-semibold"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* AI context */}
      <div className="flex items-start gap-2 bg-teal/5 border border-teal/10 rounded-lg px-3 py-2">
        <Zap className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
        <p className="text-xs text-teal/90">{story.aiContext}</p>
      </div>

      {/* Footer */}
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Read full story →
      </a>
    </div>
  );
}

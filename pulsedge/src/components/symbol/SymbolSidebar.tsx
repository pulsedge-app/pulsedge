'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Zap, MessageSquare } from 'lucide-react';
import type { NewsItem, CommunityMessage } from '@/types';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const IMPACT_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-slate-600',
};

interface Props {
  symbol: string;
}

export function SymbolSidebar({ symbol }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/news').then((r) => r.json()).catch(() => []),
      fetch(`/api/community?symbol=${symbol}`).then((r) => r.json()).catch(() => []),
    ]).then(([allNews, communityMsgs]: [NewsItem[], CommunityMessage[]]) => {
      // Filter news to those mentioning this symbol's pairs
      const symbolUpper = symbol.toUpperCase();
      const relevantNews = (allNews as NewsItem[]).filter(
        (n) => n.affectedPairs?.some((p) => p.includes(symbolUpper) || symbolUpper.includes(p.replace('/', '')))
      );
      setNews(relevantNews.slice(0, 5));
      setMessages((communityMsgs as CommunityMessage[]).slice(0, 5));
      setLoading(false);
    });
  }, [symbol]);

  return (
    <div className="space-y-4">
      {/* Related News */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
          <span className="text-sm">📰</span>
          <h3 className="text-xs font-semibold">Related News</h3>
        </div>
        <div className="px-4 py-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="py-2.5 border-b border-surface-border/50 last:border-0 animate-pulse">
                <div className="h-3 bg-white/8 rounded w-full mb-1.5" />
                <div className="h-2.5 bg-white/5 rounded w-1/2" />
              </div>
            ))
          ) : news.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-600">No recent news for {symbol}</p>
          ) : (
            news.map((item) => (
              <div key={item.id} className="py-2.5 border-b border-surface-border/50 last:border-0 group">
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${IMPACT_DOT[item.impact]}`} />
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-slate-300 hover:text-white leading-snug transition-colors"
                    >
                      {item.headline}
                      <ExternalLink className="inline w-2.5 h-2.5 ml-1 text-slate-700 -mt-0.5" />
                    </a>
                    {item.aiContext && (
                      <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-600">
                        <Zap className="w-2.5 h-2.5 text-teal/50 shrink-0 mt-0.5" />
                        <span>{item.aiContext}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-700 mt-0.5">{item.source} · {timeAgo(item.publishedAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Community Mentions */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
          <MessageSquare className="w-3.5 h-3.5 text-teal" />
          <h3 className="text-xs font-semibold">Community Mentions</h3>
        </div>
        <div className="px-4 py-2">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="py-2.5 border-b border-surface-border/50 last:border-0 animate-pulse">
                <div className="h-3 bg-white/8 rounded w-full mb-1.5" />
                <div className="h-2.5 bg-white/5 rounded w-1/3" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-600">No community mentions yet</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="py-2.5 border-b border-surface-border/50 last:border-0">
                <p className="text-xs text-slate-400 leading-relaxed">{msg.message}</p>
                <p className="text-[10px] text-slate-700 mt-0.5">
                  {msg.username} · {timeAgo(msg.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-surface-border/50">
          <Link
            href="/dashboard#community"
            className="text-[10px] text-teal hover:text-white transition-colors"
          >
            View full community →
          </Link>
        </div>
      </div>
    </div>
  );
}

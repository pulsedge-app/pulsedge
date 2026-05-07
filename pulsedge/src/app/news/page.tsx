'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Zap, RefreshCw, Share2 } from 'lucide-react';
import type { NewsItem } from '@/types';

type Category = 'ALL' | 'FOREX' | 'CRYPTO' | 'STOCKS' | 'HIGH IMPACT';

const FOREX_PAIRS = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'USD', 'XAUUSD', 'XAU'];
const CRYPTO_PAIRS = ['BTC', 'ETH', 'SOL', 'CRYPTO'];
const STOCK_TICKERS = ['SPX', 'AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'NASDAQ', 'S&P'];

const IMPACT_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-slate-600',
};
const IMPACT_BADGE: Record<string, string> = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/25',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  LOW: 'bg-slate-700/50 text-slate-500 border-slate-600/25',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function matchesCategory(item: NewsItem, cat: Category): boolean {
  if (cat === 'ALL') return true;
  if (cat === 'HIGH IMPACT') return item.impact === 'HIGH';
  const pairs = item.affectedPairs.map((p) => p.toUpperCase());
  const text = (item.headline + ' ' + item.aiContext).toUpperCase();
  if (cat === 'FOREX') return pairs.some((p) => FOREX_PAIRS.some((f) => p.includes(f))) || FOREX_PAIRS.some((f) => text.includes(f));
  if (cat === 'CRYPTO') return pairs.some((p) => CRYPTO_PAIRS.some((c) => p.includes(c))) || CRYPTO_PAIRS.some((c) => text.includes(c));
  if (cat === 'STOCKS') return pairs.some((p) => STOCK_TICKERS.some((s) => p.includes(s))) || STOCK_TICKERS.some((s) => text.includes(s));
  return true;
}

function shareToClipboard(item: NewsItem) {
  const text = `${item.headline}\n\nPulse AI: ${item.aiContext}\n\nRead more: ${item.url}`;
  navigator.clipboard.writeText(text).catch(() => {});
}

function NewsCard({ item, featured }: { item: NewsItem; featured?: boolean }) {
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    shareToClipboard(item);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (featured) {
    return (
      <div className="card p-5 bg-gradient-to-br from-navy-900/80 to-[#0d1629] border-teal/15 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2.5 h-2.5 rounded-full ${IMPACT_DOT[item.impact] ?? 'bg-slate-600'}`} />
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${IMPACT_BADGE[item.impact]}`}>
            {item.impact}
          </span>
          <span className="text-[10px] text-slate-600 ml-auto">{item.source} · {timeAgo(item.publishedAt)}</span>
        </div>
        <a href={item.url || '#'} target="_blank" rel="noopener noreferrer"
          className="block text-base font-bold text-slate-100 leading-snug hover:text-white transition-colors mb-3">
          {item.headline}
          <ExternalLink className="inline w-3.5 h-3.5 ml-1.5 text-slate-500 -mt-0.5" />
        </a>
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {item.affectedPairs.map((p) => (
            <span key={p} className="px-2 py-0.5 rounded bg-teal/8 border border-teal/15 text-teal text-[10px] font-bold">
              {p}
            </span>
          ))}
        </div>
        {item.aiContext && (
          <div className="flex items-start gap-1.5 text-xs text-slate-400 bg-white/[0.03] rounded-lg px-3 py-2.5 mb-4 flex-1">
            <Zap className="w-3.5 h-3.5 text-teal/70 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{item.aiContext}</span>
          </div>
        )}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-teal transition-colors self-start mt-auto"
        >
          <Share2 className="w-3.5 h-3.5" />
          {shared ? 'Copied!' : 'Share to community'}
        </button>
      </div>
    );
  }

  return (
    <div className="card p-4 hover:bg-white/[0.025] transition-colors group">
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${IMPACT_DOT[item.impact] ?? 'bg-slate-600'}`} />
        <div className="flex-1 min-w-0 space-y-2">
          <a href={item.url || '#'} target="_blank" rel="noopener noreferrer"
            className="block text-sm font-medium text-slate-200 hover:text-white leading-snug transition-colors">
            {item.headline}
            <ExternalLink className="inline w-3 h-3 ml-1.5 text-slate-600 -mt-0.5" />
          </a>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${IMPACT_BADGE[item.impact]}`}>
              {item.impact}
            </span>
            {item.affectedPairs.slice(0, 4).map((p) => (
              <span key={p} className="px-1.5 py-0.5 rounded bg-teal/8 border border-teal/15 text-teal text-[9px] font-bold">
                {p}
              </span>
            ))}
            <span className="text-[10px] text-slate-600">{item.source} · {timeAgo(item.publishedAt)}</span>
          </div>

          {item.aiContext && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-white/[0.02] rounded-lg px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-teal/60 shrink-0 mt-0.5" />
              <span>{item.aiContext}</span>
            </div>
          )}

          <button
            onClick={(e) => { e.preventDefault(); handleShare(); }}
            className="flex items-center gap-1 text-[10px] text-slate-700 hover:text-teal transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-white/10 mt-1 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/8 rounded w-full" />
          <div className="h-4 bg-white/6 rounded w-3/4" />
          <div className="h-3 bg-white/4 rounded w-1/2" />
          <div className="h-8 bg-white/3 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  const filtered = items.filter((item) => matchesCategory(item, category));
  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  const CATEGORIES: Category[] = ['ALL', 'FOREX', 'CRYPTO', 'STOCKS', 'HIGH IMPACT'];

  // Two-column: list on left, featured on right
  const featured = filtered[0] ?? null;
  const listItems = filtered.slice(1);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 pb-20 xl:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Market News</h1>
          <p className="text-sm text-slate-500">Curated by Pulse AI · relevance-scored from top financial sources</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {updatedStr && <span className="text-[10px] text-slate-600">Updated {updatedStr}</span>}
          <button onClick={fetchNews} disabled={loading}
            className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              category === cat
                ? cat === 'HIGH IMPACT'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                  : 'bg-teal/15 text-teal border border-teal/25'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}>
            {cat}
            {cat !== 'ALL' && !loading && (
              <span className="ml-1.5 text-[9px] opacity-60">
                {items.filter((i) => matchesCategory(i, cat)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-[55fr_45fr] gap-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="hidden xl:block">
            <div className="card p-5 h-80 animate-pulse">
              <div className="space-y-3">
                <div className="h-3 bg-white/8 rounded w-1/4" />
                <div className="h-5 bg-white/10 rounded w-full" />
                <div className="h-5 bg-white/8 rounded w-3/4" />
                <div className="h-16 bg-white/5 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 mb-1">No news available right now</p>
          <p className="text-sm text-slate-600">Our AI scans headlines every 5 minutes. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[55fr_45fr] gap-4 items-start">
          {/* Left: list */}
          <div className="space-y-3">
            {listItems.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {/* Right: featured story */}
          {featured && (
            <div className="xl:sticky xl:top-[100px]">
              <NewsCard item={featured} featured />
            </div>
          )}
        </div>
      )}

      {/* Auto-refresh note */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-[10px] text-slate-700 mt-6">
          Auto-refreshes every 5 minutes · {filtered.length} stories
        </p>
      )}
    </div>
  );
}

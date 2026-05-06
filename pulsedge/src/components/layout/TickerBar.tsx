'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MARKET_SYMBOLS, formatPrice } from '@/lib/markets';

interface TickerItem {
  symbol: string;
  price: number;
  change_percent: number;
}

export function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    async function fetch30s() {
      const tdSymbols = MARKET_SYMBOLS.map((m) => m.tdSymbol).join(',');
      try {
        const res = await fetch(`/api/prices?symbols=${encodeURIComponent(tdSymbols)}`);
        if (!res.ok) return;
        const data: Record<string, { price: number; change_percent: number }> = await res.json();
        setItems(
          MARKET_SYMBOLS.map((m) => ({
            symbol: m.symbol,
            price: data[m.tdSymbol]?.price ?? 0,
            change_percent: data[m.tdSymbol]?.change_percent ?? 0,
          }))
        );
      } catch {
        // keep previous on error
      }
    }

    fetch30s();
    const id = setInterval(fetch30s, 30_000);
    return () => clearInterval(id);
  }, []);

  const displayItems = items.length > 0 ? [...items, ...items] : [];

  return (
    <div className="h-8 bg-[#080c15] border-b border-white/[0.06] overflow-hidden flex items-center">
      {items.length === 0 ? (
        <div className="flex items-center gap-6 px-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-14 h-2 bg-white/10 rounded" />
              <div className="w-16 h-2 bg-white/8 rounded" />
              <div className="w-10 h-2 bg-white/6 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="ticker-track">
          {displayItems.map((item, i) => {
            const pos = item.change_percent >= 0;
            return (
              <Link
                key={i}
                href={`/dashboard/${item.symbol.toLowerCase()}`}
                className="flex items-center gap-1.5 px-5 hover:bg-white/5 transition-colors shrink-0 h-8"
              >
                <span className="text-[11px] font-medium text-slate-400 hover:text-white">
                  {item.symbol}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-white">
                  {formatPrice(item.price, item.symbol)}
                </span>
                <span className={`text-[10px] font-medium ${pos ? 'text-green-400' : 'text-red-400'}`}>
                  {pos ? '▲' : '▼'}{Math.abs(item.change_percent).toFixed(2)}%
                </span>
                <span className="text-white/10 text-[10px]">|</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

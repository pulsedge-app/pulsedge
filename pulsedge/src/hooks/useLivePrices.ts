'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MarketSymbol, LivePriceData } from '@/types';

type PriceMap = Record<string, LivePriceData>;

export function useLivePrices(markets: MarketSymbol[]): PriceMap {
  const [prices, setPrices] = useState<PriceMap>(() =>
    Object.fromEntries(
      markets.map((m) => [m.symbol, { price: 0, change_percent: 0, loading: true }])
    )
  );

  const fetchPrices = useCallback(async () => {
    const tdSymbols = markets.map((m) => m.tdSymbol).join(',');
    try {
      const res = await fetch(`/api/prices?symbols=${encodeURIComponent(tdSymbols)}`);
      if (!res.ok) return;
      const data: Record<string, { price: number; change_percent: number }> = await res.json();
      setPrices((prev) => {
        const next = { ...prev };
        markets.forEach((m) => {
          const d = data[m.tdSymbol];
          if (d) next[m.symbol] = { price: d.price, change_percent: d.change_percent, loading: false };
        });
        return next;
      });
    } catch {
      // keep previous prices on error
    }
  }, [markets]);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 30_000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  return prices;
}

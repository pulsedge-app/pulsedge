'use client';

import { useEffect, useRef, useId } from 'react';
import { useTheme } from 'next-themes';

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
}

let scriptLoaded = false;
const pendingCallbacks: Array<() => void> = [];

function loadTVScript(cb: () => void) {
  if (typeof window === 'undefined') return;
  if (window.TradingView) { cb(); return; }
  pendingCallbacks.push(cb);
  if (scriptLoaded) return;
  scriptLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://s3.tradingview.com/tv.js';
  s.async = true;
  s.onload = () => { pendingCallbacks.forEach((fn) => fn()); pendingCallbacks.length = 0; };
  document.head.appendChild(s);
}

export function TradingViewWidget({ symbol, height = 280 }: TradingViewWidgetProps) {
  const id = useId().replace(/:/g, '_');
  const containerId = `tv${id}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : 'dark';
  const bgColor = theme === 'dark' ? '#0f1623' : '#ffffff';

  useEffect(() => {
    let destroyed = false;

    loadTVScript(() => {
      if (destroyed || !window.TradingView || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      const div = document.createElement('div');
      div.id = containerId;
      containerRef.current.appendChild(div);

      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme,
        style: '1',
        locale: 'en',
        toolbar_bg: bgColor,
        enable_publishing: false,
        hide_top_toolbar: false,
        save_image: false,
        container_id: containerId,
        height,
        disabled_features: ['use_localstorage_for_settings', 'header_symbol_search'],
        enabled_features: ['hide_left_toolbar_by_default'],
        overrides: {
          'paneProperties.background': bgColor,
          'paneProperties.backgroundType': 'solid',
        },
      });
    });

    return () => { destroyed = true; };
  }, [symbol, theme, height, containerId, bgColor]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-t-xl"
      style={{ height }}
    />
  );
}

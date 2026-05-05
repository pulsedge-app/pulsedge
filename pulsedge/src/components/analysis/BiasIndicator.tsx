import type { Bias } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BiasIndicatorProps {
  bias: Bias;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  Bullish: {
    icon: TrendingUp,
    className: 'badge-bullish',
    bar: 'bg-green-500',
  },
  Bearish: {
    icon: TrendingDown,
    className: 'badge-bearish',
    bar: 'bg-red-500',
  },
  Neutral: {
    icon: Minus,
    className: 'badge-neutral',
    bar: 'bg-amber-500',
  },
};

export function BiasIndicator({ bias, size = 'md' }: BiasIndicatorProps) {
  const { icon: Icon, className, bar } = CONFIG[bias];
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex items-center gap-2">
      <span className={`${className} ${textSize}`}>
        <Icon className={iconSize} />
        {bias}
      </span>
      <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${bar} transition-all`}
          style={{
            width: bias === 'Bullish' ? '75%' : bias === 'Bearish' ? '75%' : '50%',
          }}
        />
      </div>
    </div>
  );
}

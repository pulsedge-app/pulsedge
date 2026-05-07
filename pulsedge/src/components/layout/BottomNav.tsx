'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Newspaper, Calendar, MessageSquare } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard#markets', label: 'Markets', icon: BarChart2, exact: false },
  { href: '/news', label: 'News', icon: Newspaper, exact: true },
  { href: '/calendar', label: 'Calendar', icon: Calendar, exact: true },
  { href: '/dashboard#community', label: 'Community', icon: MessageSquare, exact: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-surface-border bg-[#060a14]/95 backdrop-blur-md safe-area-pb">
      <div className="flex">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const hrefBase = href.split('#')[0];
          const active = exact
            ? pathname === hrefBase
            : pathname === hrefBase || pathname.startsWith(hrefBase + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[44px] text-[9px] font-semibold uppercase tracking-wide transition-colors ${
                active ? 'text-teal' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

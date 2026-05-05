'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LineChart, Calendar, MessageSquare } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analysis', label: 'Analysis', icon: LineChart },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard#community', label: 'Chat', icon: MessageSquare },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-surface-border bg-navy-900/95 backdrop-blur-md">
      <div className="flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard#community' && pathname.startsWith(href) && href !== '/dashboard') || pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                active ? 'text-teal' : 'text-slate-500 hover:text-slate-300'
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

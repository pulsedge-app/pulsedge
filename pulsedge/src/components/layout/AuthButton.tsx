'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="w-20 h-9 rounded-lg bg-white/5 animate-pulse" />;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal/10 border border-teal/20">
          <UserIcon className="w-3.5 h-3.5 text-teal" />
          <span className="text-xs font-medium text-teal truncate max-w-[120px]">
            {user.email?.split('@')[0]}
          </span>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Link href="/auth/login" className="btn-primary flex items-center gap-2 text-sm py-2">
      <LogIn className="w-4 h-4" />
      <span>Sign In</span>
    </Link>
  );
}

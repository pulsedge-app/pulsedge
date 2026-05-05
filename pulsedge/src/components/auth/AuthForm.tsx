'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSuccess('Check your email to confirm your account.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal" />
            </div>
            <span className="font-semibold text-xl">
              Pulse<span className="text-teal">edge</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {mode === 'login'
              ? 'Sign in to access your personalised analysis'
              : 'Get free access to AI-powered market analysis'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-11"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-slate-400">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <Link href="/auth/signup" className="text-teal hover:underline">
                  Sign up free
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/auth/login" className="text-teal hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>

        {mode === 'signup' && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Daily Bias', desc: 'AI-generated market direction' },
              { label: 'Key Levels', desc: 'Support & resistance zones' },
              { label: 'Entry Plans', desc: 'Precision trade setups' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-xs font-semibold text-teal">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

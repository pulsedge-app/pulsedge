'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Send, Bot, AlertCircle, CheckCircle, Heart, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { CommunityMessage } from '@/types';
import type { User } from '@supabase/supabase-js';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

async function fetchMessages(
  client: ReturnType<typeof createClient>,
  userId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<CommunityMessage[]>>,
  bottomRef: React.RefObject<HTMLDivElement>
) {
  const { data } = await client
    .from('community_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  if (!data) return;

  const messages = data as CommunityMessage[];

  // Fetch reaction counts
  const { data: reactions } = await client
    .from('community_reactions')
    .select('message_id, user_id')
    .in('message_id', messages.map((m) => m.id));

  const counts: Record<string, number> = {};
  const userReacted: Record<string, boolean> = {};
  (reactions ?? []).forEach((r: { message_id: string; user_id: string }) => {
    counts[r.message_id] = (counts[r.message_id] ?? 0) + 1;
    if (userId && r.user_id === userId) userReacted[r.message_id] = true;
  });

  const enriched = messages.map((m) => ({
    ...m,
    reaction_count: counts[m.id] ?? 0,
    user_reacted: userReacted[m.id] ?? false,
  }));

  setMessages(enriched);
  setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
}

function Avatar({ username, isBot }: { username: string; isBot: boolean }) {
  if (isBot) {
    return (
      <div className="w-6 h-6 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
        <Bot className="w-3 h-3 text-teal" />
      </div>
    );
  }
  const colors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600'];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center shrink-0 text-[10px] font-bold uppercase text-white`}>
      {username[0]}
    </div>
  );
}

function MessageRow({
  msg,
  canReact,
  onReact,
}: {
  msg: CommunityMessage;
  canReact: boolean;
  onReact: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5 py-2 px-3 hover:bg-white/[0.02] rounded-lg transition-colors group">
      <Avatar username={msg.username} isBot={msg.is_bot} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xs font-semibold ${msg.is_bot ? 'text-teal' : 'text-slate-200'}`}>
            {msg.username}
          </span>
          {msg.is_bot && <Bot className="w-2.5 h-2.5 text-teal" />}
          <span className="text-[10px] text-slate-700">{timeAgo(msg.created_at)}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mt-0.5 break-words">{msg.message}</p>

        {/* Reaction */}
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => canReact && onReact(msg.id)}
            disabled={!canReact}
            className={`flex items-center gap-1 text-[10px] transition-colors disabled:cursor-default ${
              msg.user_reacted
                ? 'text-red-400'
                : canReact
                ? 'text-slate-600 hover:text-red-400'
                : 'text-slate-700'
            }`}
          >
            <Heart className="w-3 h-3" fill={msg.user_reacted ? 'currentColor' : 'none'} />
            {(msg.reaction_count ?? 0) > 0 && (
              <span>{msg.reaction_count}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommunityFeed() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const authClient = useRef(createClient()).current;
  const isVerified = user?.email_confirmed_at != null;
  const canPost = !!user && isVerified;

  // Auth
  useEffect(() => {
    authClient.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = authClient.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, [authClient]);

  // Realtime messages — isolated client
  useEffect(() => {
    const supabase = createClient();
    const userId = user?.id ?? null;

    fetchMessages(supabase, userId, setMessages, bottomRef);

    const channel = supabase
      .channel('community_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          setMessages((prev) => [
            ...prev,
            { ...(payload.new as CommunityMessage), reaction_count: 0, user_reacted: false },
          ]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Presence — isolated client
  useEffect(() => {
    const supabase = createClient();
    const presenceKey = user?.id ?? `anon-${Math.random().toString(36).slice(2, 8)}`;

    const channel = supabase.channel('community_presence', {
      config: { presence: { key: presenceKey } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const toggleReaction = useCallback(async (messageId: string) => {
    if (!canPost) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              user_reacted: !m.user_reacted,
              reaction_count: (m.reaction_count ?? 0) + (m.user_reacted ? -1 : 1),
            }
          : m
      )
    );

    if (!user) return;
    const msg = messages.find((m) => m.id === messageId);
    if (msg?.user_reacted) {
      await authClient
        .from('community_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);
    } else {
      await authClient
        .from('community_reactions')
        .insert({ message_id: messageId, user_id: user.id });
    }
  }, [authClient, canPost, messages, user]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !canPost || sending) return;
    if (text.length > 280) { setError('Max 280 characters'); return; }
    setSending(true);
    setError('');
    const username = user!.email?.split('@')[0] ?? 'anon';
    const { error: err } = await authClient.from('community_messages').insert({
      user_id: user!.id,
      username,
      message: text,
      is_bot: false,
    });
    setSending(false);
    if (err) setError('Failed to send. Try again.');
    else setInput('');
  }, [input, canPost, sending, user, authClient]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border shrink-0">
        <span className="text-sm">💬</span>
        <h2 className="text-sm font-semibold">Pulse Community</h2>
        <div className="ml-auto flex items-center gap-2">
          {onlineCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Users className="w-3 h-3" />
              {onlineCount}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-teal" />
            LIVE
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 min-h-[300px]">
        {messages.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-slate-600">
            No messages yet — be the first!
          </div>
        )}
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            canReact={canPost}
            onReact={toggleReaction}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-surface-border p-3 space-y-2">
        {user && !isVerified && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Verify your email to post.{' '}
              <button
                className="underline hover:no-underline"
                onClick={() => authClient.auth.resend({ type: 'signup', email: user.email! })}
              >
                Resend
              </button>
            </span>
          </div>
        )}

        {!user ? (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500 mb-2">Sign up to join the conversation</p>
            <Link href="/auth/signup" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
              Sign up free →
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                placeholder={canPost ? 'Share your thoughts… (Enter to send)' : 'Verify email to post'}
                disabled={!canPost}
                rows={1}
                maxLength={280}
                className="input text-xs py-2 resize-none flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ minHeight: '36px', maxHeight: '80px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!canPost || !input.trim() || sending}
                className="btn-primary px-3 py-2 shrink-0 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {input.length > 240 && (
              <p className={`text-[10px] text-right ${input.length > 280 ? 'text-red-400' : 'text-slate-500'}`}>
                {input.length}/280
              </p>
            )}
            {isVerified && (
              <p className="text-[10px] text-slate-600 flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                Verified · posting as {user.email?.split('@')[0]}
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

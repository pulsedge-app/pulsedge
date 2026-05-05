'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { createClient } from '@/lib/supabase/client';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your Pulsedge AI analyst. Ask me about market conditions, technical levels, or any trading questions.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          isLoggedIn,
        }),
      });

      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullText };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal shadow-teal-lg flex items-center justify-center hover:bg-teal-hover transition-all duration-200 hover:scale-105 ${open ? 'hidden' : 'flex'}`}
        aria-label="Open AI chat"
      >
        <MessageCircle className="w-6 h-6 text-navy-900" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] flex flex-col card shadow-teal-lg animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pulsedge AI</p>
                <p className="text-xs text-slate-500">
                  {isLoggedIn ? 'Personalised analysis' : 'General market questions'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                    msg.role === 'assistant'
                      ? 'bg-teal/20 border border-teal/30'
                      : 'bg-slate-700'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-3.5 h-3.5 text-teal" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-white/5 text-slate-200'
                      : 'bg-teal text-navy-900 font-medium'
                  }`}
                >
                  {msg.content || (
                    <Loader2 className="w-4 h-4 animate-spin text-teal" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-surface-border">
            {!isLoggedIn && (
              <p className="text-xs text-slate-500 mb-2 text-center">
                <a href="/auth/login" className="text-teal hover:underline">
                  Sign in
                </a>{' '}
                for personalised analysis
              </p>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about market conditions..."
                rows={1}
                className="input resize-none text-sm py-2.5 flex-1"
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn-primary px-3 py-2.5 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

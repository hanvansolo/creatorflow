'use client';

import { useState } from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface NewsletterCTAProps {
  source?: string;
  variant?: 'inline' | 'banner';
}

export function NewsletterCTA({ source = 'cta', variant = 'inline' }: NewsletterCTAProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });

      if (!res.ok) throw new Error();
      setStatus('success');
      if (typeof window !== 'undefined') {
        localStorage.setItem('newsletter_subscribed', 'true');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 ${variant === 'banner' ? 'justify-center py-3' : 'py-2'}`}>
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-sm text-green-400 font-medium">Subscribed! Check your inbox.</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-emerald-900/40 via-emerald-800/30 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Get Football News Without the Waffle</h3>
              <p className="text-xs text-zinc-400">Weekly roundup. No spam. Unsubscribe any time.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full sm:w-auto gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 sm:w-56 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        {status === 'error' && (
          <p className="text-xs text-emerald-400 mt-2 text-center sm:text-right">Something went wrong. Try again.</p>
        )}
      </div>
    );
  }

  // Inline compact version (for footer)
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {status === 'loading' ? '...' : 'Go'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-emerald-400">Something went wrong.</p>
      )}
    </form>
  );
}

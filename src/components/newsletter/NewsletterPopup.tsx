'use client';

import { useState, useEffect } from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Don't show if already dismissed or subscribed
    const dismissed = localStorage.getItem('newsletter_dismissed');
    const subscribed = localStorage.getItem('newsletter_subscribed');
    if (dismissed || subscribed) return;

    // Show after 30 seconds
    const timer = setTimeout(() => setIsOpen(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setIsOpen(false);
    localStorage.setItem('newsletter_dismissed', Date.now().toString());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });

      if (!res.ok) throw new Error();
      setStatus('success');
      localStorage.setItem('newsletter_subscribed', 'true');
    } catch {
      setStatus('error');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden">
        {/* Red accent top */}
        <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-orange-500" />

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {status === 'success' ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">You&apos;re In!</h3>
              <p className="text-zinc-400 text-sm">We&apos;ll send you the good stuff. No spam, ever.</p>
              <button onClick={dismiss} className="mt-4 text-sm text-emerald-500 hover:text-emerald-400">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Football News, No Waffle</h3>
                  <p className="text-xs text-zinc-400">Weekly newsletter</p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 mb-6">
                Get the biggest football stories of the week straight to your inbox. Match results, transfer news, and tactical updates — no filler.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Subscribe — It\u0027s Free'}
                </button>
                {status === 'error' && (
                  <p className="text-xs text-emerald-400 text-center">Something went wrong. Try again.</p>
                )}
              </form>

              <p className="mt-4 text-center text-[11px] text-zinc-500">
                Unsubscribe any time. We respect your inbox.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

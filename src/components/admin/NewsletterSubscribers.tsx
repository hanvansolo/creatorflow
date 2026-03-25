'use client';

import { useState } from 'react';
import { Mail, UserMinus, Clock, Download } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  source: string;
  subscribedAt: string;
}

export function NewsletterSubscribers({ subscribers: initial }: { subscribers: Subscriber[] }) {
  const [subscribers] = useState(initial);

  const active = subscribers.filter(s => s.status === 'active');
  const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed');

  function exportCsv() {
    const csv = ['email,status,source,subscribed_at', ...active.map(s => `${s.email},${s.status},${s.source},${s.subscribedAt}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-zinc-300"><strong className="text-white">{active.length}</strong> active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-zinc-500" />
          <span className="text-sm text-zinc-300"><strong className="text-white">{unsubscribed.length}</strong> unsubscribed</span>
        </div>
        {active.length > 0 && (
          <button onClick={exportCsv} className="ml-auto flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {subscribers.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No subscribers yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscribers.map((sub) => (
            <div
              key={sub.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                sub.status === 'active'
                  ? 'border-zinc-700 bg-zinc-800/50'
                  : 'border-zinc-800 bg-zinc-900/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {sub.status === 'active' ? (
                  <Mail className="h-4 w-4 text-green-400" />
                ) : (
                  <UserMinus className="h-4 w-4 text-zinc-500" />
                )}
                <span className="text-sm text-white">{sub.email}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">{sub.source}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {new Date(sub.subscribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Mail, MailOpen, Trash2, Clock } from 'lucide-react';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export function ContactMessages({ messages: initialMessages, secret }: { messages: Message[]; secret: string }) {
  const [messages, setMessages] = useState(initialMessages);

  async function updateStatus(id: string, status: string) {
    const res = await fetch('/api/admin/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, secret }),
    });
    if (res.ok) {
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status } : m));
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm('Delete this message?')) return;
    const res = await fetch('/api/admin/contact', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, secret }),
    });
    if (res.ok) {
      setMessages(msgs => msgs.filter(m => m.id !== id));
    }
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-lg border p-4 ${
            msg.status === 'unread'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-zinc-700 bg-zinc-800/50'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {msg.status === 'unread' ? (
                  <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <MailOpen className="h-4 w-4 text-zinc-500 shrink-0" />
                )}
                <span className="font-semibold text-white truncate">{msg.subject}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-3">
                <span>{msg.name}</span>
                <span className="text-zinc-600">&middot;</span>
                <a href={`mailto:${msg.email}`} className="text-emerald-400 hover:text-emerald-300">{msg.email}</a>
                <span className="text-zinc-600">&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {msg.status === 'unread' ? (
                <button
                  onClick={() => updateStatus(msg.id, 'read')}
                  className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
                  title="Mark as read"
                >
                  <MailOpen className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => updateStatus(msg.id, 'unread')}
                  className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
                  title="Mark as unread"
                >
                  <Mail className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => deleteMessage(msg.id)}
                className="p-1.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

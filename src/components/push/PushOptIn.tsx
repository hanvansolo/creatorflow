'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { isPushSupported, getPermission, subscribeToPush } from '@/lib/push/client';

const STORAGE_KEY = 'fp:push:state';
// Bump this if we want to re-prompt users who previously dismissed.
const PROMPT_VERSION = 1;

interface State {
  visits: number;
  dismissedAt: number | null;
  subscribed: boolean;
  version: number;
}

function readState(): State {
  if (typeof window === 'undefined') return { visits: 0, dismissedAt: null, subscribed: false, version: PROMPT_VERSION };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visits: 0, dismissedAt: null, subscribed: false, version: PROMPT_VERSION };
    const parsed = JSON.parse(raw);
    return {
      visits: Number(parsed.visits) || 0,
      dismissedAt: parsed.dismissedAt ? Number(parsed.dismissedAt) : null,
      subscribed: !!parsed.subscribed,
      version: Number(parsed.version) || 0,
    };
  } catch {
    return { visits: 0, dismissedAt: null, subscribed: false, version: PROMPT_VERSION };
  }
}

function writeState(state: Partial<State>) {
  if (typeof window === 'undefined') return;
  try {
    const merged = { ...readState(), ...state, version: PROMPT_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage full or denied — silent fail.
  }
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function PushOptIn() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    const perm = getPermission();
    if (perm === 'granted' || perm === 'denied' || perm === 'unsupported') return;

    const state = readState();
    const newVisits = state.visits + 1;
    writeState({ visits: newVisits });

    // Don't prompt on the first ever visit — be polite.
    if (newVisits < 2) return;

    // Already subscribed in a previous session.
    if (state.subscribed) return;

    // Recently dismissed — leave them alone for 7 days.
    if (state.dismissedAt && Date.now() - state.dismissedAt < SEVEN_DAYS) return;

    // Stagger the prompt so it doesn't hijack the very first paint.
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const onEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        writeState({ subscribed: true, dismissedAt: null });
        setShow(false);
      } else {
        setError('Permission was not granted. You can enable it later in your browser settings.');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = () => {
    writeState({ dismissedAt: Date.now() });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <Bell className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Get live goal alerts
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Goal updates, kickoffs, and breaking transfer news straight to your device.
            </p>
            {error && <p className="mt-2 text-xs text-amber-400">{error}</p>}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onEnable}
                disabled={busy}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
              >
                {busy ? 'Enabling…' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

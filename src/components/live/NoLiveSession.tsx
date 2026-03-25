'use client';

import Link from 'next/link';
import { Radio, Calendar, Clock, FlaskConical, MapPin, ChevronRight } from 'lucide-react';
import type { Session } from '@/lib/api/openf1/types';
import { format, formatDistanceToNow } from 'date-fns';

interface NoLiveSessionProps {
  latestSession: Session | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export function NoLiveSession({ latestSession, isLoading, onRefresh }: NoLiveSessionProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
          <Radio className="h-8 w-8 text-zinc-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">No Live Session</h1>
        <p className="text-zinc-400 mb-6">
          There&apos;s no F1 session currently in progress. Check back during a race weekend!
        </p>

        {/* Pre-Season Testing Banner */}
        <Link
          href="/testing/2026-bahrain-preseason-test"
          className="block rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 p-4 text-left mb-6 hover:border-orange-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-orange-400 transition-colors">
                  Football Pre-Season 2026
                </p>
                <p className="text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Bahrain International Circuit • Feb 11-13
                  </span>
                </p>
                <p className="text-xs text-orange-400/80 mt-1.5">
                  View lap times, long runs &amp; team performance →
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 transition-colors flex-shrink-0" />
          </div>
        </Link>

        {latestSession && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Most Recent Session</h3>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <p className="font-medium text-white">{latestSession.session_name}</p>
                <p className="text-sm text-zinc-400">
                  {latestSession.circuit_short_name} • {latestSession.country_name}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(latestSession.date_end), 'MMM d, yyyy')} •{' '}
                    {formatDistanceToNow(new Date(latestSession.date_end), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/calendar"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            <Calendar className="h-4 w-4" />
            View Calendar
          </Link>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-white font-medium transition-colors disabled:opacity-50"
            >
              <Radio className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Checking...' : 'Check Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

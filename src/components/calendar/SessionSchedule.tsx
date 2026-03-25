'use client';

import { useLocation } from '@/context/LocationContext';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Clock, Tv } from 'lucide-react';

interface BroadcastChannel {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isStreaming: boolean | null;
  region?: string;
}

interface Session {
  id: string;
  sessionName: string;
  sessionType?: string;
  startDatetime: string;
  endDatetime?: string | null;
}

interface SessionScheduleProps {
  sessions: Session[];
  broadcasts?: Record<string, BroadcastChannel[]>; // keyed by session id
  compact?: boolean;
}

// Channel display config with brand colors
const CHANNEL_CONFIG: Record<string, { label: string; bg: string; text: string; border?: string }> = {
  'Sky Sports F1': { label: 'Sky Sports F1', bg: 'bg-emerald-600', text: 'text-white' },
  'Sky Sport F1': { label: 'Sky Sports F1', bg: 'bg-emerald-600', text: 'text-white' },
  'ESPN': { label: 'ESPN', bg: 'bg-emerald-700', text: 'text-white' },
  'ABC': { label: 'ABC', bg: 'bg-black', text: 'text-white', border: 'border-zinc-600' },
  'Canal+': { label: 'Canal+', bg: 'bg-black', text: 'text-white', border: 'border-zinc-600' },
  'DAZN': { label: 'DAZN', bg: 'bg-[#0c0c0c]', text: 'text-[#f5f500]', border: 'border-[#f5f500]' },
  'F1 TV Pro': { label: 'F1TV', bg: 'bg-emerald-600', text: 'text-white' },
  'Channel 4': { label: 'Channel 4', bg: 'bg-purple-600', text: 'text-white' },
  'RTL': { label: 'RTL', bg: 'bg-[#e30613]', text: 'text-white' },
  'Viaplay': { label: 'Viaplay', bg: 'bg-[#6b2d90]', text: 'text-white' },
  'TV8': { label: 'TV8', bg: 'bg-blue-600', text: 'text-white' },
  'Fox Sports': { label: 'Fox Sports', bg: 'bg-blue-700', text: 'text-white' },
  'Kayo': { label: 'Kayo', bg: 'bg-green-600', text: 'text-white' },
};

export function SessionSchedule({ sessions, broadcasts = {}, compact = false }: SessionScheduleProps) {
  const { region, timezone } = useLocation();

  if (sessions.length === 0) return null;

  // Filter broadcasts for user's region
  const getChannelsForSession = (sessionId: string) => {
    const all = broadcasts[sessionId] || [];
    // Filter to show only GLOBAL channels and channels matching user's region
    return all.filter(ch =>
      ch.region === 'GLOBAL' || ch.region === region
    );
  };

  // Get channel config with brand colors
  const getChannelConfig = (name: string) => {
    return CHANNEL_CONFIG[name] || { label: name, bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };
  };

  const formatSessionTime = (isoString: string) => {
    const zonedDate = toZonedTime(new Date(isoString), timezone);
    return {
      day: format(zonedDate, 'EEE'),
      date: format(zonedDate, 'd MMM'),
      time: format(zonedDate, 'HH:mm'),
    };
  };

  if (compact) {
    return (
      <div className="space-y-1.5">
        {sessions.map((session) => {
          const { day, time } = formatSessionTime(session.startDatetime);
          const channels = getChannelsForSession(session.id);
          return (
            <div key={session.id} className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{session.sessionName}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white">{day} {time}</span>
                {channels.length > 0 && (
                  <div className="flex items-center gap-1">
                    {channels.slice(0, 3).map((ch) => {
                      const config = getChannelConfig(ch.name);
                      return (
                        <span
                          key={ch.id}
                          className={`flex h-5 items-center justify-center rounded px-1.5 text-[8px] font-bold border ${config.bg} ${config.text} ${config.border || 'border-transparent'}`}
                          title={ch.name}
                        >
                          {config.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const { day, date, time } = formatSessionTime(session.startDatetime);
        const channels = getChannelsForSession(session.id);
        return (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-zinc-500">{day}</div>
                <div className="text-sm font-bold text-white">{date}</div>
              </div>
              <div>
                <div className="font-medium text-white">{session.sessionName}</div>
                <div className="flex items-center gap-1 text-sm text-zinc-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{time}</span>
                  <span className="text-zinc-600">local</span>
                </div>
              </div>
            </div>
            {channels.length > 0 && (
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-zinc-500" />
                <div className="flex items-center gap-1.5">
                  {channels.map((ch) => {
                    const config = getChannelConfig(ch.name);
                    return (
                      <span
                        key={ch.id}
                        className={`flex h-6 items-center rounded px-2 text-[10px] font-bold border ${config.bg} ${config.text} ${config.border || 'border-transparent'}`}
                        title={ch.name}
                      >
                        {config.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

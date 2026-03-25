'use client';

import { SessionSchedule } from '@/components/calendar/SessionSchedule';
import { RegionSelector } from '@/components/ui/RegionSelector';
import { Clock } from 'lucide-react';

interface BroadcastChannel {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isStreaming: boolean | null;
}

interface Session {
  id: string;
  sessionName: string;
  startDatetime: string;
  endDatetime?: string | null;
}

interface TestingScheduleSectionProps {
  sessions: Session[];
  broadcasts: Record<string, BroadcastChannel[]>;
  title?: string;
}

export function TestingScheduleSection({
  sessions,
  broadcasts,
  title = 'Session Schedule'
}: TestingScheduleSectionProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        <RegionSelector />
      </div>
      <SessionSchedule sessions={sessions} broadcasts={broadcasts} />
    </div>
  );
}

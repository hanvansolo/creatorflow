'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DaySelectorProps {
  days: { day: number; label: string; sessionCount: number }[];
  eventSlug: string;
}

export function DaySelector({ days, eventSlug }: DaySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDay = searchParams.get('day') || 'all';

  const handleSelect = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (day === 'all') {
      params.delete('day');
    } else {
      params.set('day', day);
    }
    const qs = params.toString();
    router.push(`/testing/${eventSlug}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleSelect('all')}
        className={cn(
          'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          selectedDay === 'all'
            ? 'bg-emerald-600/20 text-emerald-400'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
        )}
      >
        All Days
      </button>
      {days.map((d) => (
        <button
          key={d.day}
          onClick={() => handleSelect(String(d.day))}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            selectedDay === String(d.day)
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

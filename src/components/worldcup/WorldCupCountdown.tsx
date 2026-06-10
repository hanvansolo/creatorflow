'use client';

import { useEffect, useState } from 'react';

interface Remaining {
  d: number;
  h: number;
  m: number;
  s: number;
}

function remainingTo(target: number): Remaining {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

/**
 * Live ticking countdown to World Cup kick-off. Renders em-dashes on the server
 * and fills in once mounted, so there's no hydration mismatch on the seconds.
 */
export function WorldCupCountdown({ kickoff }: { kickoff: string }) {
  const target = new Date(kickoff).getTime();
  const [t, setT] = useState<Remaining | null>(null);

  useEffect(() => {
    setT(remainingTo(target));
    const id = setInterval(() => setT(remainingTo(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units: Array<{ label: string; value: number | undefined }> = [
    { label: 'Days', value: t?.d },
    { label: 'Hrs', value: t?.h },
    { label: 'Min', value: t?.m },
    { label: 'Sec', value: t?.s },
  ];

  return (
    <div className="flex items-center gap-2" role="timer" aria-label="Countdown to World Cup kick-off">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-[3.25rem] flex-col items-center rounded-xl bg-white/[0.06] px-3 py-2 ring-1 ring-white/10"
        >
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {u.value === undefined ? '—' : String(u.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/45">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

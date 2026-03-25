'use client';

import { useEffect, useState } from 'react';
import { getTimeUntil } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: string | Date;
  label?: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function CountdownTimer({
  targetDate,
  label,
  onComplete,
  size = 'md',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntil(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getTimeUntil(targetDate);
      setTimeLeft(newTime);

      if (newTime.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.total <= 0) {
    return (
      <div className="text-green-400 font-medium">
        {label ? `${label} - ` : ''}Live Now!
      </div>
    );
  }

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      box: 'w-10 h-10',
      value: 'text-sm',
      label: 'text-[10px]',
    },
    md: {
      container: 'gap-3',
      box: 'w-14 h-14',
      value: 'text-lg',
      label: 'text-xs',
    },
    lg: {
      container: 'gap-4',
      box: 'w-20 h-20',
      value: 'text-2xl',
      label: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center">
      {label && <span className="mb-2 text-sm text-zinc-400">{label}</span>}
      <div className={`flex ${classes.container}`}>
        <TimeUnit value={timeLeft.days} label="Days" classes={classes} />
        <TimeUnit value={timeLeft.hours} label="Hrs" classes={classes} />
        <TimeUnit value={timeLeft.minutes} label="Min" classes={classes} />
        <TimeUnit value={timeLeft.seconds} label="Sec" classes={classes} />
      </div>
    </div>
  );
}

interface TimeUnitProps {
  value: number;
  label: string;
  classes: {
    box: string;
    value: string;
    label: string;
  };
}

function TimeUnit({ value, label, classes }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 ${classes.box}`}
      >
        <span className={`font-mono font-bold text-white ${classes.value}`}>
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className={`mt-1 text-zinc-500 ${classes.label}`}>{label}</span>
    </div>
  );
}

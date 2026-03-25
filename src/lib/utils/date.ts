import { format, formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDateInTimezone(
  date: string | Date,
  timezone: string,
  formatStr: string = 'MMM d, yyyy HH:mm'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
}

export function formatSessionTime(date: string | Date, timezone: string = 'UTC'): string {
  return formatDateInTimezone(date, timezone, 'EEE, MMM d HH:mm');
}

export function getTimeUntil(date: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const total = differenceInSeconds(d, now);

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(total / (60 * 60 * 24));
  const hours = Math.floor((total % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((total % (60 * 60)) / 60);
  const seconds = total % 60;

  return { days, hours, minutes, seconds, total };
}

export function isInPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d < new Date();
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

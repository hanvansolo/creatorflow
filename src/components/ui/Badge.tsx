import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-emerald-600 text-white border-emerald-500',
    secondary: 'bg-zinc-600 text-white border-zinc-500 dark:bg-zinc-700 dark:border-zinc-600',
    success: 'bg-green-600 text-white border-green-500',
    warning: 'bg-amber-500 text-black border-amber-400',
    danger: 'bg-emerald-600 text-white border-emerald-500',
    outline: 'bg-zinc-100 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-500 dark:text-zinc-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

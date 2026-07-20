import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'accent' | 'warning';
}

const tones = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-white/10 dark:text-ink-200',
  success: 'bg-moss-100 text-moss-800 dark:bg-moss-900 dark:text-moss-200',
  accent: 'bg-ink-950 text-white dark:bg-white dark:text-ink-950',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
} as const;

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold tracking-wide uppercase',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

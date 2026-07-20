import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface flex min-h-80 flex-col items-center justify-center rounded-3xl border p-8 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-ink-100 dark:bg-white/8">
        <Icon className="size-6 text-ink-600 dark:text-ink-300" aria-hidden="true" />
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-ink-500 dark:text-ink-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

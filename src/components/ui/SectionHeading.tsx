import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-8 flex gap-5 ${
        centered ? 'flex-col items-center text-center' : 'items-end justify-between'
      }`}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-moss-700 uppercase dark:text-moss-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-balance text-3xl font-semibold tracking-[-0.04em] text-ink-950 sm:text-4xl dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-7 text-ink-500 dark:text-ink-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

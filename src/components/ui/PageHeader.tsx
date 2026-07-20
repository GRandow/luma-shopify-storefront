interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border-b border-black/5 bg-sand py-14 sm:py-18 dark:border-white/8 dark:bg-ink-900">
      <div className="page-shell">
        {eyebrow ? (
          <p className="mb-3 text-xs font-bold tracking-[0.18em] text-moss-700 uppercase dark:text-moss-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg dark:text-ink-300">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}

import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link
      to="/"
      className="focus-ring font-display inline-flex items-center gap-2 rounded-lg text-xl font-bold tracking-[-0.06em]"
      aria-label="Luma home"
    >
      <span className="grid size-7 place-items-center rounded-full bg-ink-950 dark:bg-white">
        <span className="size-2.5 rounded-full bg-moss-300 dark:bg-moss-600" />
      </span>
      LUMA
    </Link>
  );
}

import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-shell flex min-h-[65vh] items-center justify-center py-16 text-center">
      <div>
        <p className="font-display text-[7rem] leading-none font-semibold tracking-[-0.08em] text-ink-200 sm:text-[10rem] dark:text-ink-800">
          404
        </p>
        <h1 className="font-display -mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          This page is out of stock.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-500 dark:text-ink-400">
          The link may be old, or the page has moved somewhere more useful.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 px-5 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
            to="/"
          >
            <ArrowLeft className="size-4" />
            Go home
          </Link>
          <Link
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 px-5 text-sm font-semibold dark:border-white/15"
            to="/products"
          >
            <Search className="size-4" />
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}

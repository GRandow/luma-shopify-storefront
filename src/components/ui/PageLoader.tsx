import { LoaderCircle } from 'lucide-react';

export function PageLoader() {
  // Fills the viewport so the footer stays out of view while a page loads; a shorter
  // loader let the footer flash in and then jump down (a layout shift Lighthouse flagged).
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <LoaderCircle className="size-7 animate-spin text-moss-600" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

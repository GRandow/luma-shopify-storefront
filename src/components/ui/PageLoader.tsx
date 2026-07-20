import { LoaderCircle } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <LoaderCircle className="size-7 animate-spin text-moss-600" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

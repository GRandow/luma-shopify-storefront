import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StarRatingProps {
  rating: number;
  count?: number;
  compact?: boolean;
}

export function StarRating({ rating, count, compact = false }: StarRatingProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400')}
      aria-label={`${rating.toFixed(1)} out of 5 stars${count === undefined ? '' : `, ${count} reviews`}`}
    >
      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-medium text-ink-700 dark:text-ink-200">{rating.toFixed(1)}</span>
      {!compact && count !== undefined ? <span>({count})</span> : null}
    </span>
  );
}

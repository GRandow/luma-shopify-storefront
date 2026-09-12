import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface QuantityStepperProps {
  quantity: number;
  /** What the quantity refers to, for the button labels ("Increase quantity of …"). */
  label: string;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  onChange: (quantity: number) => void;
}

export function QuantityStepper({
  quantity,
  label,
  max = Number.POSITIVE_INFINITY,
  disabled = false,
  size = 'sm',
  onChange,
}: QuantityStepperProps) {
  const buttonClassName = cn(
    'focus-ring grid place-items-center rounded-full hover:bg-ink-100 disabled:opacity-50 dark:hover:bg-white/8',
    size === 'md' ? 'size-9' : 'size-8',
  );

  return (
    <div
      className={cn(
        'surface flex items-center rounded-full border',
        size === 'md' ? 'h-12 p-1' : 'h-10 p-0.5',
      )}
      aria-label={`Quantity of ${label}`}
    >
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled}
        onClick={() => onChange(quantity - 1)}
        aria-label={`Decrease quantity of ${label}`}
      >
        <Minus className={size === 'md' ? 'size-4' : 'size-3.5'} />
      </button>
      <output className={cn('text-center text-sm font-semibold', size === 'md' ? 'w-8' : 'w-7')}>
        {quantity}
      </output>
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled || quantity >= max}
        onClick={() => onChange(quantity + 1)}
        aria-label={`Increase quantity of ${label}`}
      >
        <Plus className={size === 'md' ? 'size-4' : 'size-3.5'} />
      </button>
    </div>
  );
}

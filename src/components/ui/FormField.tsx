import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface BaseFieldProps {
  id: string;
  label: string;
  error?: string;
}

type InputFieldProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;

export function FormField({ id, label, error, className, ...props }: InputFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="focus-ring surface h-12 w-full rounded-xl border px-4 text-sm disabled:opacity-60"
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ id, label, error, className, children, ...props }: SelectFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="focus-ring surface h-12 w-full rounded-xl border px-4 text-sm"
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'rounded-md border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error ? 'border-danger-500' : 'border-ink-300',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

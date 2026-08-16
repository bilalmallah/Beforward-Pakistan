import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, className, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

    const variants: Record<string, string> = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
      secondary: 'bg-white text-ink-900 border border-ink-300 hover:bg-ink-100 focus:ring-brand-500',
      ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 focus:ring-brand-500',
      danger: 'bg-danger-500 text-white hover:bg-red-700 focus:ring-danger-500',
    };

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? 'Please wait…' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-lg border border-ink-300/60 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

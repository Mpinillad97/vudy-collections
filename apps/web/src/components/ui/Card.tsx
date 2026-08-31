import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-stone-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    />
  );
}

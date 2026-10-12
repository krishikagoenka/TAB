import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
}

export default function Card({
  children,
  className,
  hover = false,
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card p-6 transition-all duration-200',
        hover && 'hover:scale-[1.01] hover:border-surface-400/50 hover:shadow-xl hover:shadow-primary-500/5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

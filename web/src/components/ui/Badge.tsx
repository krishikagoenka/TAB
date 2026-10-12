import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'neutral',
  children,
  className,
}: BadgeProps) {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
    neutral: 'bg-surface-600/50 text-surface-300 border-surface-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

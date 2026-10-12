import React from 'react';
import Card from '@/components/ui/Card';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={`flex flex-col items-center justify-center p-8 text-center border-dashed border-surface-600/70 bg-surface-800/40 ${
        className || ''
      }`}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-700/60 text-primary-400 border border-surface-600/40">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-surface-300 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

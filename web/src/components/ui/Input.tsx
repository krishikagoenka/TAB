'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: string;
}

export default function Input({
  label,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  prefix,
  disabled = false,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-surface-200"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 z-10 select-none rounded-md bg-surface-700 px-2 py-0.5 text-xs font-medium text-surface-200 border border-surface-500/30">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'input-field w-full',
            prefix && 'pl-14',
            error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500',
            disabled && 'opacity-50 cursor-not-allowed bg-surface-900/60',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-rose-400 font-medium mt-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'outline';
type Size = 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center font-semibold rounded-[12px] transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-coffee text-white hover:bg-coffee-600 shadow-card',
  secondary: 'bg-white text-ink border border-line hover:border-coffee-300',
  ghost: 'bg-transparent text-ink hover:bg-cream',
  success: 'bg-success text-white hover:brightness-95',
  danger: 'bg-error text-white hover:brightness-95',
  outline: 'border-2 border-coffee text-coffee bg-white hover:bg-coffee-50',
};

const sizes: Record<Size, string> = {
  md: 'h-14 px-5 text-base gap-2',
  lg: 'h-16 px-7 text-lg gap-2.5',
  xl: 'h-20 px-10 text-2xl gap-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {leftIcon}
      {loading ? 'Загрузка…' : children}
      {rightIcon}
    </button>
  );
}

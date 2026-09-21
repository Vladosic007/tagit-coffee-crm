'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'default' | 'success' | 'error' | 'accent';
  icon?: React.ReactNode;
  className?: string;
}

const tones = {
  default: 'text-ink',
  success: 'text-success',
  error: 'text-error',
  accent: 'text-coffee',
};

export function KpiCard({ label, value, sub, tone = 'default', icon, className }: KpiCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl p-5 shadow-card flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between text-muted text-sm font-medium">
        <span>{label}</span>
        {icon && <span className="text-coffee/70">{icon}</span>}
      </div>
      <div className={cn('text-3xl font-bold leading-tight', tones[tone])}>{value}</div>
      {sub && <div className="text-muted text-sm">{sub}</div>}
    </div>
  );
}

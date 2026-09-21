'use client';

import { cn } from '@/lib/cn';

interface ShiftBadgeProps {
  status: 'open' | 'closed';
}

export function ShiftBadge({ status }: ShiftBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold',
        status === 'open' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
      )}
    >
      <span
        className={cn('w-2 h-2 rounded-full', status === 'open' ? 'bg-success' : 'bg-muted')}
      />
      {status === 'open' ? 'Смена открыта' : 'Смена закрыта'}
    </span>
  );
}

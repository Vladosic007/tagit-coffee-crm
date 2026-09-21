'use client';

import { Delete } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NumericPadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  className?: string;
  compact?: boolean;
}

export function NumericPad({ onDigit, onBackspace, onClear, className, compact }: NumericPadProps) {
  const rows: (string | 'back' | 'clear' | null)[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [onClear ? 'clear' : null, '0', 'back'],
  ];
  const sz = compact ? 'h-16 text-2xl' : 'h-20 text-3xl';
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {rows.flat().map((cell, i) => {
        if (cell == null) return <div key={i} />;
        if (cell === 'back')
          return (
            <button
              key={i}
              onClick={onBackspace}
              className={cn(
                'bg-coffee-50 text-coffee rounded-2xl flex items-center justify-center hover:bg-coffee-100 active:scale-[0.98]',
                sz
              )}
            >
              <Delete size={compact ? 24 : 28} />
            </button>
          );
        if (cell === 'clear')
          return (
            <button
              key={i}
              onClick={onClear}
              className={cn(
                'bg-cream text-muted rounded-2xl flex items-center justify-center hover:bg-coffee-50 text-base',
                sz
              )}
            >
              C
            </button>
          );
        return (
          <button
            key={i}
            onClick={() => onDigit(cell)}
            className={cn(
              'bg-white rounded-2xl font-semibold text-ink shadow-card hover:bg-cream active:scale-[0.98]',
              sz
            )}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}

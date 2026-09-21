'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hideClose?: boolean;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md', hideClose }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/40 backdrop-blur-sm">
      <div
        className={cn(
          'w-full bg-white rounded-2xl shadow-soft flex flex-col max-h-[90vh]',
          sizeMap[size]
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-line">
            <div className="text-xl font-bold text-ink">{title}</div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-cream"
                aria-label="Закрыть"
              >
                <X size={22} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line bg-cream/40 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

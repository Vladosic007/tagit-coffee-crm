'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { cn } from '@/lib/cn';

interface TopBarProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  showLogout?: boolean;
  className?: string;
}

export function TopBar({ title, subtitle, onBack, right, showLogout, className }: TopBarProps) {
  const router = useRouter();
  const emp = useStore((s) => s.employees.find((e) => e.id === s.currentEmployeeId));
  const brand = useStore((s) => s.brand);
  const logout = useStore((s) => s.logout);
  return (
    <div
      className={cn(
        'h-18 px-6 flex items-center justify-between bg-white border-b border-line shrink-0',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {onBack ? (
          <button
            onClick={onBack ?? (() => router.back())}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-cream hover:bg-coffee-50"
            aria-label="Назад"
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="text-3xl">{brand.logoEmoji}</div>
        )}
        <div>
          {title && <div className="text-xl font-bold text-ink leading-tight">{title}</div>}
          {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {right}
        {emp && (
          <div className="text-right leading-tight hidden md:block">
            <div className="text-sm text-muted">{emp.role === 'owner' ? 'Владелец' : 'Бариста'}</div>
            <div className="text-base font-semibold text-ink">{emp.name}</div>
          </div>
        )}
        {showLogout && (
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-cream hover:bg-coffee-50"
            aria-label="Выйти"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

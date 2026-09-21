'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3, ClipboardList, Coffee, Users, ArrowLeft } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { cn } from '@/lib/cn';
import { Protected } from '@/components/layout/Protected';

const items = [
  { to: '/owner', label: 'Отчёт', icon: BarChart3, end: true },
  { to: '/owner/shifts', label: 'Смены', icon: ClipboardList },
  { to: '/owner/menu', label: 'Меню', icon: Coffee },
  { to: '/owner/employees', label: 'Сотрудники', icon: Users },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const emp = useStore((s) => s.employees.find((e) => e.id === s.currentEmployeeId));
  const brand = useStore((s) => s.brand);

  return (
    <Protected ownerOnly>
      <div className="min-h-screen flex bg-cream">
        <aside className="w-64 bg-white border-r border-line flex flex-col shrink-0">
          <div className="h-18 px-5 flex items-center gap-3 border-b border-line">
            <div className="text-2xl">{brand.logoEmoji}</div>
            <div>
              <div className="font-bold text-ink leading-tight">{brand.name}</div>
              <div className="text-xs text-muted">Кабинет владельца</div>
            </div>
          </div>
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {items.map(({ to, label, icon: Icon, end }) => {
              const isActive = end ? pathname === to : pathname === to || pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  href={to}
                  className={cn(
                    'flex items-center gap-3 px-4 h-12 rounded-xl font-semibold',
                    isActive ? 'bg-coffee text-white' : 'text-ink hover:bg-cream'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-line">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-2 px-4 h-11 rounded-xl bg-cream hover:bg-coffee-50 font-semibold text-ink"
            >
              <ArrowLeft size={16} /> На кассу
            </button>
            {emp && (
              <div className="mt-3 text-xs text-muted text-center">
                {emp.name} · {emp.role === 'owner' ? 'Владелец' : 'Бариста'}
              </div>
            )}
          </div>
        </aside>
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>
      </div>
    </Protected>
  );
}

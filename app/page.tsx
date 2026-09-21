'use client';

import { useRouter } from 'next/navigation';
import { Protected } from '@/components/layout/Protected';
import { Coffee, DoorOpen, DoorClosed, Wallet, BarChart3, ClipboardList, LogOut, Play } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { TopBar } from '@/components/ui/TopBar';
import { Button } from '@/components/ui/Button';
import { ShiftBadge } from '@/components/ui/ShiftBadge';
import { moneyPlain, fmtTime } from '@/lib/format';

function _InnerPage() {
  const router = useRouter();
  const emp = useStore((s) => s.employees.find((e) => e.id === s.currentEmployeeId));
  const currentShift = useStore((s) => s.currentShift());
  const shiftStats = useStore((s) => s.shiftStats);
  const brand = useStore((s) => s.brand);

  const stats = currentShift ? shiftStats(currentShift.id) : null;
  const isOpen = currentShift?.status === 'open';

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <TopBar
        title={brand.name}
        subtitle={emp ? `${emp.role === 'owner' ? 'Владелец' : 'Бариста'} · ${emp.name}` : ''}
        showLogout
        right={
          emp?.role === 'owner' && (
            <Button variant="secondary" size="md" onClick={() => router.push('/owner')} leftIcon={<BarChart3 size={18} />}>
              Кабинет владельца
            </Button>
          )
        }
      />

      <div className="flex-1 px-8 py-8 flex items-stretch justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: shift status */}
          <div className="bg-white rounded-2xl p-6 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-muted text-sm font-medium">Текущая смена</div>
              <ShiftBadge status={isOpen ? 'open' : 'closed'} />
            </div>
            {isOpen && currentShift ? (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-muted text-xs">Открыта в</div>
                  <div className="text-lg font-semibold">{fmtTime(currentShift.openedAt)}</div>
                </div>
                <div>
                  <div className="text-muted text-xs">Выручка</div>
                  <div className="text-3xl font-extrabold text-ink">
                    {moneyPlain(stats?.revenueTotal ?? 0)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-muted text-xs">Наличные</div>
                    <div className="font-semibold">{moneyPlain(stats?.revenueCash ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-muted text-xs">Перевод</div>
                    <div className="font-semibold">{moneyPlain(stats?.revenueTransfer ?? 0)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-muted text-xs">Чеков</div>
                  <div className="text-xl font-semibold">{stats?.checks ?? 0}</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-center py-4 text-muted">
                <Coffee size={48} className="text-coffee/50 mb-3" />
                <div className="font-medium">Смена ещё не открыта</div>
                <div className="text-xs mt-1">Внесите размен, чтобы начать продажи</div>
              </div>
            )}
          </div>

          {/* Center: big action */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-card p-8 flex-1 flex flex-col items-center justify-center gap-6">
              {isOpen ? (
                <>
                  <div className="text-muted">Готов принять заказ</div>
                  <button
                    onClick={() => router.push('/order')}
                    className="w-full max-w-md h-40 rounded-3xl bg-coffee text-white shadow-soft flex flex-col items-center justify-center gap-3 hover:bg-coffee-600 active:scale-[0.99]"
                  >
                    <Play size={40} />
                    <span className="text-3xl font-extrabold tracking-wide">Новый заказ</span>
                  </button>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <button
                      onClick={() => router.push('/cash-movement')}
                      className="h-16 rounded-2xl bg-white border border-line hover:border-coffee-300 flex items-center justify-center gap-2 font-semibold text-ink whitespace-nowrap active:scale-[0.98]"
                    >
                      <Wallet size={18} className="shrink-0" />
                      <span>Инкассация</span>
                    </button>
                    <button
                      onClick={() => router.push('/shift/close')}
                      className="h-16 rounded-2xl bg-white border border-line hover:border-coffee-300 flex items-center justify-center gap-2 font-semibold text-ink whitespace-nowrap active:scale-[0.98]"
                    >
                      <DoorClosed size={18} className="shrink-0" />
                      <span>Закрыть смену</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-muted">Начните рабочий день</div>
                  <button
                    onClick={() => router.push('/shift/open')}
                    className="w-full max-w-md h-40 rounded-3xl bg-coffee text-white shadow-soft flex flex-col items-center justify-center gap-3 hover:bg-coffee-600 active:scale-[0.99]"
                  >
                    <DoorOpen size={40} />
                    <span className="text-3xl font-extrabold tracking-wide">Открыть смену</span>
                  </button>
                  {emp?.role === 'owner' && (
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<ClipboardList size={20} />}
                      onClick={() => router.push('/owner')}
                    >
                      Отчёты и кабинет
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Protected>
      <_InnerPage />
    </Protected>
  );
}

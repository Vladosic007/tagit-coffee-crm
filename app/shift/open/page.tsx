'use client';

import { useState } from 'react';
import { Protected } from '@/components/layout/Protected';
import { useRouter } from 'next/navigation';
import { DoorOpen } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { TopBar } from '@/components/ui/TopBar';
import { Button } from '@/components/ui/Button';
import { NumericPad } from '@/components/ui/NumericPad';
import { moneyPlain, fmtDateTime } from '@/lib/format';

function _InnerPage() {
  const router = useRouter();
  const [cash, setCash] = useState('');
  const [busy, setBusy] = useState(false);
  const openShift = useStore((s) => s.openShift);
  const cashN = Number(cash || 0);

  async function submit() {
    if (cashN < 0 || busy) return;
    setBusy(true);
    try {
      await openShift(cashN);
      router.replace('/');
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar title="Открытие смены" onBack={() => router.push('/')} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-[1fr,320px] gap-6 items-start">
          <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-3 text-coffee">
                <div className="w-12 h-12 rounded-xl bg-coffee-50 flex items-center justify-center">
                  <DoorOpen size={24} />
                </div>
                <div>
                  <div className="text-xl font-bold text-ink">Внесите размен</div>
                  <div className="text-sm text-muted">Сумма наличных в кассе на начало смены</div>
                </div>
              </div>
            </div>
            <div className="bg-cream rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Начальная сумма</div>
              <div className="text-5xl font-extrabold text-ink">
                {cash ? `${Number(cash).toLocaleString('ru-RU')} ₽` : '0 ₽'}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map((v) => (
                <button
                  key={v}
                  onClick={() => setCash(String((Number(cash || 0) || 0) + v))}
                  className="h-12 rounded-xl bg-cream hover:bg-coffee-50 font-semibold text-ink"
                >
                  +{moneyPlain(v)}
                </button>
              ))}
            </div>
            <div className="border-t border-line pt-4 text-xs text-muted">
              Смена откроется в {fmtDateTime(new Date())}
            </div>
            <Button size="xl" block disabled={cash === '' || busy} loading={busy} onClick={submit}>
              Открыть смену
            </Button>
          </div>
          <NumericPad
            compact
            onDigit={(d) => setCash((c) => (c === '0' ? d : c + d))}
            onBackspace={() => setCash((c) => c.slice(0, -1))}
            onClear={() => setCash('')}
          />
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

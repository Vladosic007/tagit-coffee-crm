'use client';

import { useMemo, useState } from 'react';
import { Protected } from '@/components/layout/Protected';
import { useRouter } from 'next/navigation';
import { AlertTriangle, DoorClosed, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { TopBar } from '@/components/ui/TopBar';
import { Button } from '@/components/ui/Button';
import { NumericPad } from '@/components/ui/NumericPad';
import { moneyPlain, fmtTime } from '@/lib/format';
import { cn } from '@/lib/cn';

function _InnerPage() {
  const router = useRouter();
  const currentShift = useStore((s) => s.currentShift());
  const stats = useStore((s) => (currentShift ? s.shiftStats(currentShift.id) : null));
  const closeShift = useStore((s) => s.closeShift);
  const [counted, setCounted] = useState('');
  const [busy, setBusy] = useState(false);

  const countedN = Number(counted || 0);
  const expected = stats?.expectedCash ?? 0;
  const diff = countedN - expected;

  const shift = currentShift;

  if (!shift || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-cream">
        <div className="text-xl">Нет открытой смены</div>
        <Button onClick={() => router.push('/')}>На главный</Button>
      </div>
    );
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await closeShift(countedN);
      router.replace('/');
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar
        title="Закрытие смены"
        subtitle={`Открыта в ${fmtTime(shift.openedAt)} · ${shift.openedByName}`}
        onBack={() => router.push('/')}
      />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr,1fr,320px] gap-6">
          {/* Left summary */}
          <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-4">
            <div className="text-lg font-bold text-ink">Итоги смены</div>
            <Row label="Начальная касса" value={moneyPlain(shift.cashStart)} />
            <Row label="Выручка наличными" value={`+${moneyPlain(stats.revenueCash)}`} tone="positive" />
            <Row label="Выручка переводом" value={moneyPlain(stats.revenueTransfer)} />
            <Row
              label="Внесение (добавили)"
              value={stats.deposits > 0 ? `+${moneyPlain(stats.deposits)}` : moneyPlain(0)}
              tone={stats.deposits > 0 ? 'positive' : 'muted'}
            />
            <Row
              label="Инкассация (забрали)"
              value={stats.collections > 0 ? `−${moneyPlain(stats.collections)}` : moneyPlain(0)}
              tone={stats.collections > 0 ? 'negative' : 'muted'}
            />
            <div className="border-t border-line pt-1" />
            <div className="bg-cream rounded-xl p-3 flex items-baseline justify-between">
              <div className="text-sm text-muted">
                Расчёт: {shift.cashStart} + {stats.revenueCash} + {stats.deposits} − {stats.collections}
              </div>
              <div className="text-lg font-extrabold text-ink tabular-nums">= {moneyPlain(expected)}</div>
            </div>
            <div className="border-t border-line pt-3" />
            <Row label="Всего чеков" value={String(stats.checks)} />
            <Row label="Общая выручка" value={moneyPlain(stats.revenueTotal)} bold />
          </div>

          {/* Center reconcile */}
          <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-5">
            <div className="text-lg font-bold text-ink">Сверка кассы</div>
            <div className="bg-cream rounded-xl p-4">
              <div className="text-xs text-muted">Ожидаемо (по системе)</div>
              <div className="text-3xl font-extrabold text-ink">{moneyPlain(expected)}</div>
            </div>
            <div className="bg-cream rounded-xl p-4">
              <div className="text-xs text-muted">Пересчитано фактически</div>
              <div className="text-3xl font-extrabold text-coffee">
                {counted ? `${Number(counted).toLocaleString('ru-RU')} ₽` : '0 ₽'}
              </div>
            </div>
            <div
              className={cn(
                'rounded-xl p-4 border-2',
                counted === ''
                  ? 'border-line bg-white'
                  : diff === 0
                  ? 'border-success bg-success/5'
                  : diff > 0
                  ? 'border-success/70 bg-success/5'
                  : 'border-error bg-error/5'
              )}
            >
              <div className="text-xs text-muted mb-1 flex items-center gap-1">
                {counted !== '' && (diff === 0 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />)}
                Расхождение
              </div>
              <div
                className={cn(
                  'text-3xl font-extrabold',
                  diff === 0 ? 'text-success' : diff > 0 ? 'text-success' : 'text-error'
                )}
              >
                {counted === '' ? '—' : (
                  diff === 0 ? '0 ₽' : `${diff > 0 ? '+' : ''}${moneyPlain(Math.abs(diff) * (diff > 0 ? 1 : -1)).replace('-', '−')}`
                )}
              </div>
              <div className="text-xs text-muted mt-1">
                {counted === ''
                  ? 'Введите фактическую сумму'
                  : diff === 0
                  ? 'Всё сходится ✓'
                  : diff > 0
                  ? 'Излишек'
                  : 'Недостача'}
              </div>
            </div>
            <Button
              size="xl"
              block
              disabled={counted === '' || busy}
              loading={busy}
              onClick={submit}
              leftIcon={<DoorClosed size={22} />}
            >
              Закрыть смену
            </Button>
          </div>

          {/* Numpad */}
          <NumericPad
            compact
            onDigit={(d) => setCounted((c) => (c === '0' ? d : c + d))}
            onBackspace={() => setCounted((c) => c.slice(0, -1))}
            onClear={() => setCounted('')}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone = 'default',
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: 'default' | 'positive' | 'negative' | 'muted';
}) {
  const toneCls =
    tone === 'positive'
      ? 'text-success'
      : tone === 'negative'
      ? 'text-error'
      : tone === 'muted'
      ? 'text-muted'
      : 'text-ink';
  return (
    <div className="flex items-baseline justify-between">
      <div className="text-muted">{label}</div>
      <div className={cn('tabular-nums', bold ? 'text-xl font-extrabold' : 'font-semibold', toneCls)}>
        {value}
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

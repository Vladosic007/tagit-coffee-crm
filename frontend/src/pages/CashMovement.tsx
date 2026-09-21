import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TopBar } from '../components/ui/TopBar';
import { Button } from '../components/ui/Button';
import { NumericPad } from '../components/ui/NumericPad';
import { moneyPlain, fmtTime } from '../lib/format';
import { cn } from '../lib/cn';
import type { CashMovementType } from '../lib/types';

export default function CashMovement() {
  const nav = useNavigate();
  const currentShift = useStore((s) => s.currentShift());
  const cms = useStore((s) => (currentShift ? s.shiftCashMovements(currentShift.id) : []));
  const stats = useStore((s) => (currentShift ? s.shiftStats(currentShift.id) : null));
  const addCashMovement = useStore((s) => s.addCashMovement);

  const [type, setType] = useState<CashMovementType>('collection');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const amountN = Number(amount || 0);

  if (!currentShift) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-cream">
        <div className="text-xl">Нет открытой смены</div>
        <Button onClick={() => nav('/')}>На главный</Button>
      </div>
    );
  }

  async function submit() {
    if (amountN <= 0 || busy) return;
    setBusy(true);
    try {
      await addCashMovement(amountN, type, comment);
      setAmount('');
      setComment('');
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar title="Инкассация / Внесение" onBack={() => nav('/')} />
      <div className="flex-1 p-6 flex items-start justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr,320px,1fr] gap-6">
          <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-coffee-50 flex items-center justify-center">
                <Wallet size={24} className="text-coffee" />
              </div>
              <div>
                <div className="text-xl font-bold text-ink">Движение наличных</div>
                <div className="text-sm text-muted">Ожидаемо в кассе: {moneyPlain(stats?.expectedCash ?? 0)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType('collection')}
                className={cn(
                  'rounded-xl px-4 py-4 border-2 flex flex-col items-start gap-1 transition',
                  type === 'collection'
                    ? 'border-coffee bg-coffee-50'
                    : 'border-line bg-white hover:border-coffee-200'
                )}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={18} className="text-coffee" />
                  <div className="font-semibold text-ink">Инкассация</div>
                </div>
                <div className="text-xs text-muted">Изъять наличные</div>
              </button>
              <button
                onClick={() => setType('deposit')}
                className={cn(
                  'rounded-xl px-4 py-4 border-2 flex flex-col items-start gap-1 transition',
                  type === 'deposit'
                    ? 'border-coffee bg-coffee-50'
                    : 'border-line bg-white hover:border-coffee-200'
                )}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownRight size={18} className="text-success" />
                  <div className="font-semibold text-ink">Внесение</div>
                </div>
                <div className="text-xs text-muted">Добавить размен</div>
              </button>
            </div>

            <div className="bg-cream rounded-xl p-5">
              <div className="text-sm text-muted mb-1">Сумма</div>
              <div className="text-4xl font-extrabold text-ink">
                {amount ? `${Number(amount).toLocaleString('ru-RU')} ₽` : '0 ₽'}
              </div>
            </div>

            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (например: сдал в банк)"
              className="w-full h-14 rounded-xl border border-line px-4 text-ink placeholder:text-muted focus:border-coffee"
            />

            <Button size="xl" block disabled={amountN <= 0 || busy} loading={busy} onClick={submit}>
              {type === 'collection' ? 'Изъять из кассы' : 'Внести в кассу'}
            </Button>
          </div>

          <NumericPad
            compact
            onDigit={(d) => setAmount((a) => (a === '0' ? d : a + d))}
            onBackspace={() => setAmount((a) => a.slice(0, -1))}
            onClear={() => setAmount('')}
          />

          <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-3">
            <div className="text-lg font-bold text-ink">История за смену</div>
            {cms.length === 0 ? (
              <div className="text-muted text-sm">Пока пусто</div>
            ) : (
              <div className="flex flex-col gap-2">
                {[...cms].reverse().map((cm) => (
                  <div key={cm.id} className="bg-cream rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">
                        {cm.type === 'collection' ? 'Инкассация' : 'Внесение'}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {fmtTime(cm.createdAt)} · {cm.employeeName}
                        {cm.comment ? ` · ${cm.comment}` : ''}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'font-bold tabular-nums',
                        cm.type === 'collection' ? 'text-error' : 'text-success'
                      )}
                    >
                      {cm.type === 'collection' ? '−' : '+'}
                      {moneyPlain(cm.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

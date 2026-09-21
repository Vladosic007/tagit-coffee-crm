import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Smartphone, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TopBar } from '../components/ui/TopBar';
import { Button } from '../components/ui/Button';
import { NumericPad } from '../components/ui/NumericPad';
import { moneyPlain } from '../lib/format';
import { cn } from '../lib/cn';

type Mode = 'choose' | 'cash' | 'transfer';

export default function Payment() {
  const nav = useNavigate();
  const total = useStore((s) => s.cartTotal());
  const brand = useStore((s) => s.brand);
  const createOrder = useStore((s) => s.createOrder);

  const [mode, setMode] = useState<Mode>('choose');
  const [received, setReceived] = useState('');
  const [busy, setBusy] = useState(false);

  const receivedN = useMemo(() => Number(received || 0), [received]);
  const change = Math.max(0, receivedN - total);
  const notEnough = receivedN < total;

  async function pay(method: 'cash' | 'transfer') {
    if (busy) return;
    setBusy(true);
    try {
      const cashReceived = method === 'cash' ? receivedN : undefined;
      const o = await createOrder(method, cashReceived);
      if (o) {
        nav(`/success/${o.id}`, { replace: true });
      }
    } catch (e) {
      alert(`Ошибка: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }

  if (total <= 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-cream">
        <div className="text-6xl">🧺</div>
        <div className="text-xl font-semibold">Корзина пуста</div>
        <Button onClick={() => nav('/order')}>К каталогу</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <TopBar
        title="Оплата"
        subtitle={mode === 'choose' ? 'Выберите способ' : mode === 'cash' ? 'Наличные' : 'Перевод по номеру'}
        onBack={() => (mode === 'choose' ? nav('/order') : setMode('choose'))}
      />

      <div className="flex-1 p-6 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-2xl p-6 shadow-card mb-6 flex items-baseline justify-between">
            <div className="text-muted">К оплате</div>
            <div className="text-5xl font-extrabold text-coffee">{moneyPlain(total)}</div>
          </div>

          {mode === 'choose' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setMode('cash')}
                className="bg-white rounded-2xl p-8 shadow-card hover:shadow-soft active:scale-[0.99] flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 rounded-2xl bg-coffee-50 flex items-center justify-center">
                  <Banknote size={48} className="text-coffee" />
                </div>
                <div className="text-2xl font-extrabold text-ink">Наличные</div>
                <div className="text-muted text-sm text-center">Пробить и рассчитать сдачу</div>
              </button>
              <button
                onClick={() => setMode('transfer')}
                className="bg-white rounded-2xl p-8 shadow-card hover:shadow-soft active:scale-[0.99] flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 rounded-2xl bg-coffee-50 flex items-center justify-center">
                  <Smartphone size={48} className="text-coffee" />
                </div>
                <div className="text-2xl font-extrabold text-ink">Перевод по номеру</div>
                <div className="text-muted text-sm text-center">Показать реквизиты клиенту</div>
              </button>
            </div>
          )}

          {mode === 'cash' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr,320px] gap-6 items-start">
              <div className="bg-white rounded-2xl p-6 shadow-card flex flex-col gap-4">
                <div>
                  <div className="text-sm text-muted mb-1">Получено от клиента</div>
                  <div className="text-4xl font-extrabold text-ink">
                    {received ? `${Number(received).toLocaleString('ru-RU')} ₽` : '0 ₽'}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000, 2000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setReceived(String((Number(received || 0) || 0) + v))}
                      className="h-12 rounded-xl bg-cream hover:bg-coffee-50 font-semibold text-ink"
                    >
                      +{v}
                    </button>
                  ))}
                  <button
                    onClick={() => setReceived(String(Math.ceil(total / 100) * 100))}
                    className="h-12 rounded-xl bg-coffee-50 hover:bg-coffee-100 font-semibold text-coffee col-span-2"
                  >
                    ≈ под чек
                  </button>
                </div>
                <div className="border-t border-line pt-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-muted">Сдача</div>
                    <div
                      className={cn(
                        'text-3xl font-extrabold',
                        notEnough ? 'text-error' : 'text-success'
                      )}
                    >
                      {notEnough
                        ? `не хватает ${moneyPlain(total - receivedN)}`
                        : moneyPlain(change)}
                    </div>
                  </div>
                </div>
                <Button size="xl" block disabled={notEnough || busy} loading={busy} onClick={() => pay('cash')} leftIcon={<Check size={22} />}>
                  Оплачено наличными
                </Button>
              </div>
              <NumericPad
                compact
                onDigit={(d) => setReceived((r) => (r === '0' ? d : r + d))}
                onBackspace={() => setReceived((r) => r.slice(0, -1))}
                onClear={() => setReceived('')}
              />
            </div>
          )}

          {mode === 'transfer' && (
            <div className="bg-white rounded-2xl p-8 shadow-card flex flex-col items-center gap-6">
              <div className="text-center">
                <div className="text-muted text-sm">Клиент переводит на номер</div>
                <div className="mt-2 text-4xl font-extrabold text-ink tracking-wide">
                  {brand.transferPhone}
                </div>
                <div className="mt-1 text-muted">
                  {brand.transferHolder} · {brand.transferBank}
                </div>
              </div>
              <div className="w-full max-w-md border border-line rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-muted text-xs">Сумма перевода</div>
                  <div className="text-3xl font-extrabold text-coffee">{moneyPlain(total)}</div>
                </div>
                <Smartphone size={40} className="text-coffee/40" />
              </div>
              <div className="w-full max-w-md">
                <Button size="xl" block variant="success" disabled={busy} loading={busy} onClick={() => pay('transfer')} leftIcon={<Check size={22} />}>
                  Оплачено
                </Button>
                <div className="text-xs text-muted mt-3 text-center">
                  Бариста подтверждает после получения перевода
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

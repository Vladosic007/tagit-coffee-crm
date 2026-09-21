'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, Plus, ScanLine, Home } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { moneyPlain, fmtDateTime } from '@/lib/format';
import { Protected } from '@/components/layout/Protected';

export default function SuccessPage() {
  return (
    <Protected>
      <Success />
    </Protected>
  );
}

function Success() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const brand = useStore((s) => s.brand);
  const [showReceipt, setShowReceipt] = useState(false);

  const receiptUrl = useMemo(() => {
    if (!order) return '';
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/receipt/${order.id}`;
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-cream">
        <div className="text-xl">Заказ не найден</div>
        <Button onClick={() => router.push('/')}>На главный</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-soft p-8 flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 size={64} className="text-success" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <div className="text-3xl font-extrabold text-ink">Оплачено</div>
          <div className="text-muted mt-1">Заказ №{order.receiptNo}</div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 text-center">
          <div className="bg-cream rounded-xl p-4">
            <div className="text-xs text-muted">Сумма</div>
            <div className="text-2xl font-extrabold text-coffee">{moneyPlain(order.total)}</div>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <div className="text-xs text-muted">Способ</div>
            <div className="text-xl font-bold text-ink">
              {order.paymentMethod === 'cash' ? 'Наличные' : 'Перевод'}
            </div>
          </div>
        </div>

        {order.paymentMethod === 'cash' && order.change != null && (
          <div className="w-full bg-success/5 border border-success/20 rounded-xl p-4 flex items-baseline justify-between">
            <div className="text-muted">Сдача клиенту</div>
            <div className="text-2xl font-bold text-success">{moneyPlain(order.change)}</div>
          </div>
        )}

        <div className="w-full grid grid-cols-2 gap-4">
          <Button variant="secondary" size="xl" block onClick={() => setShowReceipt(true)} leftIcon={<ScanLine size={20} />}>
            Квитанция
          </Button>
          <Button size="xl" block onClick={() => router.push('/order')} leftIcon={<Plus size={22} />}>
            Новый заказ
          </Button>
        </div>

        <button className="text-muted text-sm flex items-center gap-1 hover:text-coffee" onClick={() => router.push('/')}>
          <Home size={14} /> На главный
        </button>
      </div>

      <Modal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Квитанция"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button block variant="secondary" onClick={() => setShowReceipt(false)}>
              Закрыть
            </Button>
            <Button block onClick={() => window.print()}>
              Печать
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white border border-line rounded-xl">
            <QRCodeSVG value={receiptUrl} size={180} />
          </div>
          <div className="text-xs text-muted text-center">Клиент сканирует QR — открывается электронная квитанция</div>

          <div className="w-full border border-line rounded-xl p-5 font-mono text-sm bg-cream/40">
            <div className="text-center font-bold text-ink text-base">{brand.name}</div>
            <div className="text-center text-muted text-xs mt-1">{fmtDateTime(order.createdAt)}</div>
            <div className="text-center text-muted text-xs">Чек №{order.receiptNo}</div>
            <div className="border-t border-dashed border-muted/30 my-3" />
            {order.items.map((it, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <span>{it.productName}</span>
                  <span className="tabular-nums">
                    {it.qty} × {it.unitPrice}
                  </span>
                </div>
                {it.mods.length > 0 && (
                  <div className="text-xs text-muted pl-2">{it.mods.map((m) => m.optionName).join(' · ')}</div>
                )}
                {it.discount > 0 && (
                  <div className="text-xs text-error pl-2 font-semibold">
                    скидка {it.discount}% (−{Math.round(it.unitPrice * it.qty - it.lineTotal)})
                  </div>
                )}
                <div className="text-right tabular-nums">= {it.lineTotal}</div>
              </div>
            ))}
            <div className="border-t border-dashed border-muted/30 my-3" />
            <div className="flex justify-between font-bold text-base">
              <span>Итого</span>
              <span className="tabular-nums">{moneyPlain(order.total)}</span>
            </div>
            <div className="text-xs text-muted mt-1">
              Оплата: {order.paymentMethod === 'cash' ? 'наличные' : 'перевод'}
            </div>
            <div className="text-center text-xs text-muted mt-4">Не является фискальным чеком</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

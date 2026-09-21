'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Modal } from '@/components/ui/Modal';
import { moneyPlain, fmtDateTime, fmtTime } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function ShiftJournal() {
  const shifts = useStore((s) => [...s.shifts].sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1)));
  const orders = useStore((s) => s.orders);
  const cms = useStore((s) => s.cashMovements);
  const shiftStats = useStore((s) => s.shiftStats);
  const [openId, setOpenId] = useState<string | null>(null);
  const openShift = openId ? shifts.find((s) => s.id === openId) : null;
  const openOrders = openShift ? orders.filter((o) => o.shiftId === openShift.id) : [];
  const openCms = openShift ? cms.filter((c) => c.shiftId === openShift.id) : [];
  const stats = openShift ? shiftStats(openShift.id) : null;

  const totalRevenue = useMemo(
    () => shifts.reduce((s, sh) => s + shiftStats(sh.id).revenueTotal, 0),
    [shifts, shiftStats]
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b border-line bg-white">
        <div className="text-2xl font-extrabold text-ink">Журнал смен</div>
        <div className="text-sm text-muted">
          Всего смен: {shifts.length} · Общая выручка: {moneyPlain(totalRevenue)}
        </div>
      </div>
      <div className="p-8">
        {shifts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-muted">Пока нет смен</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="grid grid-cols-[1.2fr,1.2fr,1fr,1fr,1fr,1fr,40px] gap-3 px-5 py-3 text-xs uppercase tracking-wide text-muted border-b border-line font-semibold">
              <div>Открыта</div>
              <div>Закрыта</div>
              <div>Бариста</div>
              <div>Чеков</div>
              <div>Выручка</div>
              <div>Расхождение</div>
              <div />
            </div>
            {shifts.map((sh) => {
              const s = shiftStats(sh.id);
              const diff =
                sh.cashCounted != null ? sh.cashCounted - s.expectedCash : null;
              return (
                <button
                  key={sh.id}
                  onClick={() => setOpenId(sh.id)}
                  className="w-full text-left grid grid-cols-[1.2fr,1.2fr,1fr,1fr,1fr,1fr,40px] gap-3 px-5 py-4 items-center border-b border-line last:border-b-0 hover:bg-cream/60"
                >
                  <div className="font-semibold text-ink">{fmtDateTime(sh.openedAt)}</div>
                  <div className="text-muted">{sh.closedAt ? fmtDateTime(sh.closedAt) : '—'}</div>
                  <div>{sh.openedByName}</div>
                  <div className="tabular-nums">{s.checks}</div>
                  <div className="tabular-nums font-semibold">{moneyPlain(s.revenueTotal)}</div>
                  <div
                    className={cn(
                      'tabular-nums font-semibold',
                      diff == null
                        ? 'text-muted'
                        : diff === 0
                        ? 'text-success'
                        : diff > 0
                        ? 'text-success'
                        : 'text-error'
                    )}
                  >
                    {diff == null ? '—' : diff === 0 ? '0 ₽' : `${diff > 0 ? '+' : ''}${moneyPlain(diff)}`}
                  </div>
                  <ArrowRight size={18} className="text-muted" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!openShift}
        onClose={() => setOpenId(null)}
        title={openShift ? `Смена от ${fmtDateTime(openShift.openedAt)}` : ''}
        size="lg"
      >
        {openShift && stats && (
          <div className="grid grid-cols-2 gap-4">
            <Card label="Бариста" value={openShift.openedByName} />
            <Card
              label="Продолжительность"
              value={openShift.closedAt ? `${fmtTime(openShift.openedAt)} – ${fmtTime(openShift.closedAt)}` : 'Открыта'}
            />
            <Card label="Начальная касса" value={moneyPlain(openShift.cashStart)} />
            <Card
              label="Пересчитано"
              value={openShift.cashCounted != null ? moneyPlain(openShift.cashCounted) : '—'}
            />
            <Card label="Чеков" value={String(stats.checks)} />
            <Card label="Общая выручка" value={moneyPlain(stats.revenueTotal)} />
            <Card label="Наличные" value={moneyPlain(stats.revenueCash)} />
            <Card label="Перевод" value={moneyPlain(stats.revenueTransfer)} />
            <div className="col-span-2 border-t border-line pt-3">
              <div className="font-bold text-ink mb-2">Продажи ({openOrders.length})</div>
              <div className="max-h-64 overflow-y-auto flex flex-col gap-2">
                {openOrders.map((o) => (
                  <div key={o.id} className="bg-cream rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ink">
                        №{o.receiptNo} · {fmtTime(o.createdAt)}
                      </div>
                      <div className="text-xs text-muted">
                        {o.items.length} позиций · {o.paymentMethod === 'cash' ? 'наличные' : 'перевод'}
                      </div>
                    </div>
                    <div className="font-bold text-coffee">{moneyPlain(o.total)}</div>
                  </div>
                ))}
              </div>
            </div>
            {openCms.length > 0 && (
              <div className="col-span-2">
                <div className="font-bold text-ink mb-2">Движения наличных</div>
                <div className="flex flex-col gap-2">
                  {openCms.map((cm) => (
                    <div key={cm.id} className="bg-cream rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {cm.type === 'collection' ? 'Инкассация' : 'Внесение'}
                        </div>
                        <div className="text-xs text-muted">
                          {fmtTime(cm.createdAt)} · {cm.employeeName}
                          {cm.comment ? ` · ${cm.comment}` : ''}
                        </div>
                      </div>
                      <div
                        className={cn(
                          'font-bold',
                          cm.type === 'collection' ? 'text-error' : 'text-success'
                        )}
                      >
                        {cm.type === 'collection' ? '−' : '+'}
                        {moneyPlain(cm.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream rounded-xl p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-bold text-ink">{value}</div>
    </div>
  );
}

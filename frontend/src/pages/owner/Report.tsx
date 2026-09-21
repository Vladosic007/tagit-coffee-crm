import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Receipt, Wallet, Banknote, Smartphone, TrendingUp, Tag } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCard';
import { moneyPlain, todayIso, pad2 } from '../../lib/format';
import { getPeriodReport, type PeriodReport } from '../../api/services';
import { cn } from '../../lib/cn';

type Preset = 'day' | 'week' | 'month' | 'year' | 'custom';

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function rangeForPreset(preset: Preset, anchor: string): { from: string; to: string } {
  const a = new Date(anchor + 'T00:00:00');
  if (preset === 'day') return { from: anchor, to: anchor };
  if (preset === 'week') {
    // ISO week: Monday-based
    const day = (a.getDay() + 6) % 7; // 0=Mon
    const from = new Date(a);
    from.setDate(a.getDate() - day);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { from: isoOf(from), to: isoOf(to) };
  }
  if (preset === 'month') {
    const from = new Date(a.getFullYear(), a.getMonth(), 1);
    const to = new Date(a.getFullYear(), a.getMonth() + 1, 0);
    return { from: isoOf(from), to: isoOf(to) };
  }
  if (preset === 'year') {
    return { from: `${a.getFullYear()}-01-01`, to: `${a.getFullYear()}-12-31` };
  }
  return { from: anchor, to: anchor };
}

function fmtRange(from: string, to: string): string {
  if (from === to) {
    const d = new Date(from + 'T00:00:00');
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
  const f = new Date(from + 'T00:00:00');
  const t = new Date(to + 'T00:00:00');
  return `${pad2(f.getDate())}.${pad2(f.getMonth() + 1)}.${f.getFullYear()} — ${pad2(t.getDate())}.${pad2(t.getMonth() + 1)}.${t.getFullYear()}`;
}

export default function Report() {
  const [preset, setPreset] = useState<Preset>('day');
  const [anchor, setAnchor] = useState(todayIso());
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());
  const [data, setData] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return rangeForPreset(preset, anchor);
  }, [preset, anchor, customFrom, customTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPeriodReport(range.from, range.to)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const revenueTotal = data?.revenueTotal ?? 0;
  const revenueCash = data?.revenueCash ?? 0;
  const revenueTransfer = data?.revenueTransfer ?? 0;
  const checks = data?.checks ?? 0;
  const avg = data?.avg ?? 0;
  const collections = data?.collections ?? 0;
  const deposits = data?.deposits ?? 0;

  const byHourData = useMemo(() => {
    if (!data?.byHour) return [];
    return Object.entries(data.byHour)
      .filter(([h]) => Number(h) >= 6 && Number(h) <= 23)
      .map(([h, v]) => ({ hour: `${h}:00`, value: v as number }));
  }, [data]);

  const byDayData = useMemo(() => {
    if (!data?.byDay) return [];
    return Object.entries(data.byDay).map(([d, v]) => ({ day: d.slice(5), value: v as number }));
  }, [data]);

  const pieData = [
    { name: 'Наличные', value: revenueCash, color: '#6F4E37' },
    { name: 'Перевод', value: revenueTransfer, color: '#3E7C5A' },
  ];

  const showByDay = preset !== 'day' && byDayData.length > 1;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b border-line bg-white flex flex-col gap-4">
        <div>
          <div className="text-2xl font-extrabold text-ink">Отчёт</div>
          <div className="text-sm text-muted">Период: {fmtRange(range.from, range.to)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { k: 'day', label: 'Сегодня' },
              { k: 'week', label: 'Неделя' },
              { k: 'month', label: 'Месяц' },
              { k: 'year', label: 'Год' },
              { k: 'custom', label: 'Свой' },
            ] as const
          ).map((p) => (
            <button
              key={p.k}
              onClick={() => setPreset(p.k)}
              className={cn(
                'h-11 px-5 rounded-full font-semibold text-sm whitespace-nowrap',
                preset === p.k
                  ? 'bg-coffee text-white shadow-card'
                  : 'bg-white border border-line text-ink hover:bg-coffee-50'
              )}
            >
              {p.label}
            </button>
          ))}
          {preset !== 'custom' ? (
            <input
              type="date"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              className="h-11 px-4 rounded-xl border border-line font-semibold text-ink"
              title="Опорная дата периода"
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-11 px-4 rounded-xl border border-line font-semibold text-ink"
              />
              <span className="text-muted">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                className="h-11 px-4 rounded-xl border border-line font-semibold text-ink"
              />
            </div>
          )}
          {loading && <span className="text-xs text-muted animate-pulse">загрузка…</span>}
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
      </div>

      <div className="p-8 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Выручка" value={moneyPlain(revenueTotal)} tone="accent" icon={<TrendingUp size={18} />} />
          <KpiCard label="Чеков" value={checks} icon={<Receipt size={18} />} />
          <KpiCard label="Средний чек" value={moneyPlain(avg)} />
          <KpiCard
            label="Движение наличных"
            value={
              <span>
                <span className="text-success">+{moneyPlain(deposits)}</span>{' '}
                <span className="text-error">−{moneyPlain(collections)}</span>
              </span>
            }
            icon={<Wallet size={18} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-card p-5 lg:col-span-2 flex flex-col">
            <div className="font-bold text-ink mb-3">
              {showByDay ? 'Выручка по дням' : 'Выручка по часам'}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={showByDay ? byDayData : byHourData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE1D6" />
                  <XAxis
                    dataKey={showByDay ? 'day' : 'hour'}
                    tick={{ fill: '#7A6E64', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#7A6E64', fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number) => moneyPlain(v)}
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #EAE1D6', borderRadius: 8 }}
                  />
                  <Bar dataKey="value" fill="#6F4E37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col">
            <div className="font-bold text-ink mb-3">Способы оплаты</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => moneyPlain(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-cream rounded-xl p-3 flex items-center gap-2">
                <Banknote size={18} className="text-coffee" />
                <div className="text-sm">
                  <div className="text-muted text-xs">Наличные</div>
                  <div className="font-bold">{moneyPlain(revenueCash)}</div>
                </div>
              </div>
              <div className="bg-cream rounded-xl p-3 flex items-center gap-2">
                <Smartphone size={18} className="text-success" />
                <div className="text-sm">
                  <div className="text-muted text-xs">Перевод</div>
                  <div className="font-bold">{moneyPlain(revenueTransfer)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="font-bold text-ink mb-3">Топ позиций</div>
            {data && data.top.length === 0 ? (
              <div className="text-muted text-sm">За период продаж не было</div>
            ) : (
              <div>
                {data?.top.map((it, i) => {
                  const max = data.top[0]?.qty || 1;
                  return (
                    <div key={i} className="py-2.5 border-b last:border-b-0 border-line flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-coffee-50 text-coffee font-bold flex items-center justify-center text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink truncate">{it.name}</div>
                        <div className="h-1.5 bg-cream rounded mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-coffee rounded"
                            style={{ width: `${Math.max(6, (it.qty / max) * 100)}%` }}
                          />
                        </div>
                        {(it.discountedQty ?? 0) > 0 && (
                          <div className="text-xs text-muted mt-1">
                            в т.ч. со скидкой — {it.discountedQty} шт. ({moneyPlain(it.discountedRevenue ?? 0)})
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-ink tabular-nums">{it.qty} шт.</div>
                        <div className="text-xs text-muted tabular-nums">{moneyPlain(it.revenue)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="font-bold text-ink mb-3 flex items-center gap-2">
              <Tag size={18} className="text-coffee" /> Продано со скидкой
            </div>
            {data && (!data.topDiscounted || data.topDiscounted.length === 0) ? (
              <div className="text-muted text-sm">Со скидками ничего не пробивали</div>
            ) : (
              <div>
                {data?.topDiscounted?.map((row, i) => (
                  <div key={i} className="py-2.5 border-b last:border-b-0 border-line flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">{row.name}</div>
                      <div className="text-xs text-muted">скидка {row.discount}%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-ink tabular-nums">{row.qty} шт.</div>
                      <div className="text-xs text-muted tabular-nums">{moneyPlain(row.revenue)}</div>
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

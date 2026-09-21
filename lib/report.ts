import { prisma } from './prisma';
import { pad2 } from './format';

export async function reportForRange(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lt: to } },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });
  const shifts = await prisma.shift.findMany({
    where: { openedAt: { gte: from, lt: to } },
    include: { openedBy: true },
  });
  const cms = await prisma.cashMovement.findMany({ where: { createdAt: { gte: from, lt: to } } });

  const revenueCash = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
  const revenueTransfer = orders.filter((o) => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);
  const revenueTotal = revenueCash + revenueTransfer;
  const checks = orders.length;
  const avg = checks > 0 ? Math.round(revenueTotal / checks) : 0;

  const byHour: Record<string, number> = {};
  for (let h = 0; h < 24; h++) byHour[pad2(h)] = 0;
  for (const o of orders) {
    byHour[pad2(new Date(o.createdAt).getHours())] += o.total;
  }

  const byDay: Record<string, number> = {};
  const cursor = new Date(from);
  while (cursor < to) {
    byDay[`${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (byDay[key] != null) byDay[key] += o.total;
  }

  interface TopRow {
    productId: string;
    name: string;
    qty: number;
    revenue: number;
    discountedQty: number;
    discountedRevenue: number;
  }
  const topMap = new Map<string, TopRow>();
  interface DiscRow { key: string; name: string; discount: number; qty: number; revenue: number }
  const discMap = new Map<string, DiscRow>();
  for (const o of orders) {
    for (const it of o.items) {
      const key = it.productName;
      const prev = topMap.get(key) ?? {
        productId: it.productId ?? '',
        name: it.productName,
        qty: 0,
        revenue: 0,
        discountedQty: 0,
        discountedRevenue: 0,
      };
      prev.qty += it.qty;
      prev.revenue += it.lineTotal;
      const discount = (it as { discount?: number }).discount ?? 0;
      if (discount > 0) {
        prev.discountedQty += it.qty;
        prev.discountedRevenue += it.lineTotal;
        const dKey = `${it.productName}|${discount}`;
        const dPrev = discMap.get(dKey) ?? { key: dKey, name: it.productName, discount, qty: 0, revenue: 0 };
        dPrev.qty += it.qty;
        dPrev.revenue += it.lineTotal;
        discMap.set(dKey, dPrev);
      }
      topMap.set(key, prev);
    }
  }
  const top = Array.from(topMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const topDiscounted = Array.from(discMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 15);

  const collections = cms.filter((c) => c.type === 'collection').reduce((s, c) => s + c.amount, 0);
  const deposits = cms.filter((c) => c.type === 'deposit').reduce((s, c) => s + c.amount, 0);

  return {
    revenueCash,
    revenueTransfer,
    revenueTotal,
    checks,
    avg,
    byHour,
    byDay,
    top,
    topDiscounted,
    collections,
    deposits,
    shifts: shifts.map((s) => ({ ...s, openedByName: s.openedBy.name })),
  };
}

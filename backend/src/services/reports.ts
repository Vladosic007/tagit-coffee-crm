import { prisma } from '../prisma.js';

export async function computeShiftStats(shiftId: string) {
  const [shift, orders, cms] = await Promise.all([
    prisma.shift.findUnique({ where: { id: shiftId } }),
    prisma.order.findMany({ where: { shiftId } }),
    prisma.cashMovement.findMany({ where: { shiftId } }),
  ]);
  if (!shift) throw new Error('Shift not found');
  const revenueCash = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
  const revenueTransfer = orders.filter((o) => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);
  const revenueTotal = revenueCash + revenueTransfer;
  const checks = orders.length;
  const collections = cms.filter((c) => c.type === 'collection').reduce((s, c) => s + c.amount, 0);
  const deposits = cms.filter((c) => c.type === 'deposit').reduce((s, c) => s + c.amount, 0);
  const expectedCash = shift.cashStart + revenueCash - collections + deposits;
  return {
    revenueCash,
    revenueTransfer,
    revenueTotal,
    checks,
    collections,
    deposits,
    expectedCash,
    diff: shift.cashCounted != null ? shift.cashCounted - expectedCash : null,
  };
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

  // by hour
  const byHour: Record<string, number> = {};
  for (let h = 0; h < 24; h++) byHour[String(h).padStart(2, '0')] = 0;
  for (const o of orders) {
    const h = String(new Date(o.createdAt).getHours()).padStart(2, '0');
    byHour[h] += o.total;
  }

  // by day (for period > 1 day)
  const byDay: Record<string, number> = {};
  const cursor = new Date(from);
  while (cursor < to) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    byDay[key] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (byDay[key] != null) byDay[key] += o.total;
  }

  // top items — aggregated + discounted-only breakdown
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
      // Discount lives on OrderItem when the migration is applied; before that, it's 0.
      const itemAny = it as { discount?: number };
      const discount = itemAny.discount ?? 0;
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

import { prisma } from './prisma';
import type { ShiftStats } from './types';

export async function computeShiftStats(shiftId: string): Promise<ShiftStats> {
  const [shift, orders, cms] = await Promise.all([
    prisma.shift.findUnique({ where: { id: shiftId } }),
    prisma.order.findMany({ where: { shiftId } }),
    prisma.cashMovement.findMany({ where: { shiftId } }),
  ]);
  if (!shift) throw new Error('Shift not found');
  const revenueCash = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
  const revenueTransfer = orders
    .filter((o) => o.paymentMethod === 'transfer')
    .reduce((s, o) => s + o.total, 0);
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

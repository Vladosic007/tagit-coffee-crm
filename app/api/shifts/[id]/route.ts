import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeShiftStats } from '@/lib/shiftStats';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const shift = await prisma.shift.findUnique({
    where: { id: params.id },
    include: {
      openedBy: true,
      closedBy: true,
      orders: { include: { items: true } },
      cashMovements: { include: { employee: true } },
    },
  });
  if (!shift) return NextResponse.json({ error: 'Смена не найдена' }, { status: 404 });
  const stats = await computeShiftStats(shift.id);
  const { openedBy, closedBy, cashMovements, ...rest } = shift;
  return NextResponse.json({
    shift: {
      ...rest,
      openedByName: openedBy.name,
      closedByName: closedBy?.name ?? null,
      cashMovements: cashMovements.map((cm) => {
        const { employee, ...cmRest } = cm;
        return { ...cmRest, employeeName: employee.name };
      }),
    },
    stats,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const id = params.id;
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: 'Смена не найдена' }, { status: 404 });
  // Каскад руками: order_items → orders → cash_movements → shift.
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { order: { shiftId: id } } }),
    prisma.order.deleteMany({ where: { shiftId: id } }),
    prisma.cashMovement.deleteMany({ where: { shiftId: id } }),
    prisma.shift.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';

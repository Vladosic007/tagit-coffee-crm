import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const Body = z.object({
  type: z.enum(['collection', 'deposit']),
  amount: z.number().int().min(1),
  comment: z.string().default(''),
});

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const shift = await prisma.shift.findFirst({ where: { status: 'open' } });
  if (!shift) return NextResponse.json({ error: 'Нет открытой смены' }, { status: 409 });
  const cm = await prisma.cashMovement.create({
    data: {
      shiftId: shift.id,
      employeeId: check.user.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
      comment: parsed.data.comment,
    },
    include: { employee: true },
  });
  const { employee, ...cmRest } = cm;
  return NextResponse.json({ movement: { ...cmRest, employeeName: employee.name } });
}

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const { searchParams } = new URL(req.url);
  const shiftId = searchParams.get('shiftId') ?? undefined;
  const cms = await prisma.cashMovement.findMany({
    where: shiftId ? { shiftId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { employee: true },
  });
  return NextResponse.json({
    movements: cms.map((c) => {
      const { employee, ...rest } = c;
      return { ...rest, employeeName: employee.name };
    }),
  });
}

export const dynamic = 'force-dynamic';

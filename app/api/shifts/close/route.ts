import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeShiftStats } from '@/lib/shiftStats';

const CloseBody = z.object({ cashCounted: z.number().int().min(0) });

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = CloseBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'cashCounted required' }, { status: 400 });
  const shift = await prisma.shift.findFirst({ where: { status: 'open' } });
  if (!shift) return NextResponse.json({ error: 'Нет открытой смены' }, { status: 404 });
  const updated = await prisma.shift.update({
    where: { id: shift.id },
    data: {
      cashCounted: parsed.data.cashCounted,
      closedAt: new Date(),
      closedById: check.user.id,
      status: 'closed',
    },
  });
  const stats = await computeShiftStats(updated.id);
  return NextResponse.json({ shift: updated, stats });
}

export const dynamic = 'force-dynamic';

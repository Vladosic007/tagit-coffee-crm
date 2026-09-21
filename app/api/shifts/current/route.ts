import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeShiftStats } from '@/lib/shiftStats';

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const shift = await prisma.shift.findFirst({
    where: { status: 'open' },
    include: { openedBy: true, closedBy: true },
  });
  if (!shift) return NextResponse.json({ shift: null, stats: null });
  const stats = await computeShiftStats(shift.id);
  const { openedBy, closedBy, ...rest } = shift;
  return NextResponse.json({
    shift: { ...rest, openedByName: openedBy.name, closedByName: closedBy?.name ?? null },
    stats,
  });
}

export const dynamic = 'force-dynamic';

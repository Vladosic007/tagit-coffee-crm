import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeShiftStats } from '@/lib/shiftStats';

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const shifts = await prisma.shift.findMany({
    orderBy: { openedAt: 'desc' },
    include: { openedBy: true, closedBy: true },
  });
  const withStats = await Promise.all(
    shifts.map(async (s) => {
      const { openedBy, closedBy, ...rest } = s;
      return {
        ...rest,
        openedByName: openedBy.name,
        closedByName: closedBy?.name ?? null,
        stats: await computeShiftStats(s.id),
      };
    })
  );
  return NextResponse.json({ shifts: withStats });
}

export const dynamic = 'force-dynamic';

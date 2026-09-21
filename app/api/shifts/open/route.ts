import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const OpenBody = z.object({ cashStart: z.number().int().min(0) });

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const body = await req.json().catch(() => null);
  const parsed = OpenBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'cashStart required' }, { status: 400 });
  const existingOpen = await prisma.shift.findFirst({ where: { status: 'open' } });
  if (existingOpen)
    return NextResponse.json({ error: 'Смена уже открыта', shiftId: existingOpen.id }, { status: 409 });
  const shift = await prisma.shift.create({
    data: { openedById: check.user.id, cashStart: parsed.data.cashStart, status: 'open' },
  });
  return NextResponse.json({ shift });
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const Body = z.object({ name: z.string().min(1), sortOrder: z.number().int().optional() });

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const count = await prisma.category.count();
  const c = await prisma.category.create({
    data: { name: parsed.data.name, sortOrder: parsed.data.sortOrder ?? count + 1 },
  });
  return NextResponse.json({ category: c });
}

export const dynamic = 'force-dynamic';

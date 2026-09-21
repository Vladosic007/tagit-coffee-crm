import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CreateBody = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  basePrice: z.number().int().min(0),
  emoji: z.string().optional(),
  modifierGroupIds: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const products = await prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({
    products: products.map((p) => ({ ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) })),
  });
}

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const p = await prisma.product.create({
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      basePrice: parsed.data.basePrice,
      emoji: parsed.data.emoji,
      modifierGroupIds: JSON.stringify(parsed.data.modifierGroupIds),
      sortOrder: parsed.data.sortOrder,
    },
  });
  return NextResponse.json({ product: { ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) } });
}

export const dynamic = 'force-dynamic';

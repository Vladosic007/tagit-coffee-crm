import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const UpdateBody = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
  basePrice: z.number().int().min(0).optional(),
  emoji: z.string().optional(),
  modifierGroupIds: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = UpdateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.modifierGroupIds) data.modifierGroupIds = JSON.stringify(parsed.data.modifierGroupIds);
  const p = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json({ product: { ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) } });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const p = await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ product: { ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) } });
}

export const dynamic = 'force-dynamic';

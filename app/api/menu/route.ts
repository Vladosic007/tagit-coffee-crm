import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const [categories, products, modifierGroups] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.product.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.modifierGroup.findMany(),
  ]);
  return NextResponse.json({
    categories,
    products: products.map((p) => ({
      ...p,
      modifierGroupIds: JSON.parse(p.modifierGroupIds) as string[],
    })),
    modifierGroups: modifierGroups.map((g) => ({
      ...g,
      options: JSON.parse(g.options),
    })),
  });
}

export const dynamic = 'force-dynamic';

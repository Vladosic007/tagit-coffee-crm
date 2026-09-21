import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, employee: true },
  });
  if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
  const brand = await prisma.setting.findMany({ where: { key: { startsWith: 'brand.' } } });
  const brandObj: Record<string, string> = {};
  for (const r of brand) brandObj[r.key.replace('brand.', '')] = r.value;
  const { employee, ...orderRest } = order;
  const u = new URL(req.url);
  return NextResponse.json({
    order: {
      ...orderRest,
      items: order.items.map((i) => ({ ...i, modifiers: JSON.parse(i.modifiers) })),
      employeeName: employee.name,
    },
    brand: brandObj,
    receiptUrl: `${u.origin}/receipt/${order.id}`,
  });
}

export const dynamic = 'force-dynamic';

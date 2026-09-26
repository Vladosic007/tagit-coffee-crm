import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ModSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionName: z.string(),
  priceDelta: z.number().int(),
});

const ItemSchema = z.object({
  productId: z.string().optional(),         // либо productId из БД
  customName: z.string().min(1).optional(), // либо свободная позиция
  customPrice: z.number().int().min(0).optional(),
  qty: z.number().int().min(1),
  mods: z.array(ModSchema).default([]),
  discount: z.number().int().min(0).max(100).default(0),
}).refine(
  (i) => (i.productId != null) !== (i.customName != null && i.customPrice != null),
  { message: 'Нужен либо productId, либо customName + customPrice' }
);

const CreateOrderBody = z.object({
  items: z.array(ItemSchema).min(1),
  paymentMethod: z.enum(['cash', 'transfer']),
  cashReceived: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = CreateOrderBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const shift = await prisma.shift.findFirst({ where: { status: 'open' } });
  if (!shift) return NextResponse.json({ error: 'Нет открытой смены' }, { status: 409 });

  const productIds = body.items.filter((i) => i.productId).map((i) => i.productId!);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: Array<{
    productId: string | null; productName: string; unitPrice: number; qty: number;
    modifiers: string; discount: number; lineTotal: number;
  }> = [];
  let total = 0;
  for (const it of body.items) {
    let productId: string | null;
    let productName: string;
    let baseUnit: number;
    let mods = it.mods;
    if (it.productId) {
      const p = byId.get(it.productId);
      if (!p || !p.isActive)
        return NextResponse.json({ error: `Позиция ${it.productId} не найдена или в стоп-листе` }, { status: 400 });
      productId = p.id;
      productName = p.name;
      baseUnit = p.basePrice;
    } else {
      productId = null;
      productName = it.customName!;
      baseUnit = it.customPrice!;
      mods = [];
    }
    const modDelta = mods.reduce((s, m) => s + m.priceDelta, 0);
    const unitPrice = baseUnit + modDelta;
    const discount = Math.min(100, Math.max(0, Math.round(it.discount)));
    const discountedUnit = Math.round((unitPrice * (100 - discount)) / 100);
    const lineTotal = discountedUnit * it.qty;
    total += lineTotal;
    items.push({
      productId,
      productName,
      unitPrice,
      qty: it.qty,
      modifiers: JSON.stringify(
        mods.map((m) => ({ groupName: m.groupName, optionName: m.optionName, priceDelta: m.priceDelta }))
      ),
      discount,
      lineTotal,
    });
  }

  if (body.paymentMethod === 'cash' && body.cashReceived != null && body.cashReceived < total)
    return NextResponse.json({ error: 'Получено меньше, чем сумма чека' }, { status: 400 });
  const change =
    body.paymentMethod === 'cash' && body.cashReceived != null
      ? Math.max(0, body.cashReceived - total)
      : null;

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { receiptNo: 'desc' } });
    const receiptNo = (last?.receiptNo ?? 0) + 1;
    return tx.order.create({
      data: {
        receiptNo,
        shiftId: shift.id,
        employeeId: check.user.id,
        total,
        paymentMethod: body.paymentMethod,
        cashReceived: body.cashReceived ?? null,
        change,
        items: { create: items },
      },
      include: { items: true },
    });
  });

  return NextResponse.json({
    order: { ...order, items: order.items.map((i) => ({ ...i, modifiers: JSON.parse(i.modifiers) })) },
  });
}

export const dynamic = 'force-dynamic';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../plugins/auth.js';

const ModSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionName: z.string(),
  priceDelta: z.number().int(),
});

const ItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().min(1),
  mods: z.array(ModSchema).default([]),
  discount: z.number().int().min(0).max(100).default(0),
});

const CreateOrderBody = z.object({
  items: z.array(ItemSchema).min(1),
  paymentMethod: z.enum(['cash', 'transfer']),
  cashReceived: z.number().int().min(0).optional(),
});

export async function orderRoutes(app: FastifyInstance) {
  // Атомарное создание продажи. Цена считается на бэке из БД, не с фронта.
  app.post('/orders', { preHandler: [requireAuth('barista', 'owner')] }, async (req, reply) => {
    const parsed = CreateOrderBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload', details: parsed.error.flatten() });
    const body = parsed.data;

    const shift = await prisma.shift.findFirst({ where: { status: 'open' } });
    if (!shift) return reply.code(409).send({ error: 'Нет открытой смены' });

    // Fetch products server-side
    const productIds = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: Array<{
      productId: string; productName: string; unitPrice: number; qty: number;
      modifiers: string; discount: number; lineTotal: number;
    }> = [];
    let total = 0;
    for (const it of body.items) {
      const p = byId.get(it.productId);
      if (!p || !p.isActive) {
        return reply.code(400).send({ error: `Позиция ${it.productId} не найдена или в стоп-листе` });
      }
      const modDelta = it.mods.reduce((s, m) => s + m.priceDelta, 0);
      const unitPrice = p.basePrice + modDelta;
      const discount = Math.min(100, Math.max(0, Math.round(it.discount)));
      // Discounted unit price rounded to nearest ruble, then × qty.
      const discountedUnit = Math.round(unitPrice * (100 - discount) / 100);
      const lineTotal = discountedUnit * it.qty;
      total += lineTotal;
      items.push({
        productId: p.id,
        productName: p.name,
        unitPrice,
        qty: it.qty,
        modifiers: JSON.stringify(it.mods.map((m) => ({
          groupName: m.groupName, optionName: m.optionName, priceDelta: m.priceDelta,
        }))),
        discount,
        lineTotal,
      });
    }

    if (body.paymentMethod === 'cash' && body.cashReceived != null && body.cashReceived < total) {
      return reply.code(400).send({ error: 'Получено меньше, чем сумма чека' });
    }
    const change =
      body.paymentMethod === 'cash' && body.cashReceived != null
        ? Math.max(0, body.cashReceived - total)
        : null;

    // Атомарная транзакция: номер чека + заказ + позиции
    const order = await prisma.$transaction(async (tx) => {
      const last = await tx.order.findFirst({ orderBy: { receiptNo: 'desc' } });
      const receiptNo = (last?.receiptNo ?? 0) + 1;
      return tx.order.create({
        data: {
          receiptNo,
          shiftId: shift.id,
          employeeId: req.user!.id,
          total,
          paymentMethod: body.paymentMethod,
          cashReceived: body.cashReceived ?? null,
          change,
          items: { create: items },
        },
        include: { items: true },
      });
    });

    return { order: mapOrder(order) };
  });

  app.get('/orders/:id/receipt', { preHandler: [requireAuth()] }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, employee: true },
    });
    if (!order) return reply.code(404).send({ error: 'Заказ не найден' });
    const brand = await prisma.setting.findMany({ where: { key: { startsWith: 'brand.' } } });
    const brandObj: Record<string, string> = {};
    for (const r of brand) brandObj[r.key.replace('brand.', '')] = r.value;
    const { employee, ...orderRest } = order;
    return {
      order: { ...mapOrder(orderRest as typeof order & { items: Array<{ modifiers: string }> }), employeeName: employee.name },
      brand: brandObj,
      receiptUrl: `${req.protocol}://${req.hostname}/receipt/${order.id}`,
    };
  });
}

function mapOrder<T extends { items: Array<{ modifiers: string; [k: string]: unknown }> }>(o: T) {
  return {
    ...o,
    items: o.items.map((i) => ({ ...i, modifiers: JSON.parse(i.modifiers) })),
  };
}

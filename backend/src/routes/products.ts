import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../plugins/auth.js';

const CreateProductBody = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  basePrice: z.number().int().min(0),
  emoji: z.string().optional(),
  modifierGroupIds: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});
const UpdateProductBody = CreateProductBody.partial().extend({
  isActive: z.boolean().optional(),
});
const CategoryBody = z.object({ name: z.string().min(1), sortOrder: z.number().int().optional() });

export async function productRoutes(app: FastifyInstance) {
  app.get('/products', { preHandler: [requireAuth('owner')] }, async () => {
    const products = await prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
    return { products: products.map((p) => ({ ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) })) };
  });

  app.post('/products', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
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
    return { product: { ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) } };
  });

  app.patch('/products/:id', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.modifierGroupIds) data.modifierGroupIds = JSON.stringify(parsed.data.modifierGroupIds);
    const p = await prisma.product.update({ where: { id }, data });
    return { product: { ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) } };
  });

  app.delete('/products/:id', { preHandler: [requireAuth('owner')] }, async (req) => {
    const id = (req.params as { id: string }).id;
    // Soft delete via isActive to keep historical order_items intact
    const p = await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { product: { ...p, modifierGroupIds: JSON.parse(p.modifierGroupIds) } };
  });

  // Categories
  app.get('/categories', { preHandler: [requireAuth('owner')] }, async () => {
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    return { categories };
  });

  app.post('/categories', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const parsed = CategoryBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
    const count = await prisma.category.count();
    const c = await prisma.category.create({
      data: { name: parsed.data.name, sortOrder: parsed.data.sortOrder ?? count + 1 },
    });
    return { category: c };
  });

  app.patch('/categories/:id', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = CategoryBody.partial().extend({ isActive: z.boolean().optional() }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
    const c = await prisma.category.update({ where: { id }, data: parsed.data });
    return { category: c };
  });
}

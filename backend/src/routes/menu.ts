import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { requireAuth } from '../plugins/auth.js';

export async function menuRoutes(app: FastifyInstance) {
  app.get('/menu', { preHandler: [requireAuth()] }, async () => {
    const [categories, products, modifierGroups] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.modifierGroup.findMany(),
    ]);
    return {
      categories,
      products: products.map((p) => ({
        ...p,
        modifierGroupIds: JSON.parse(p.modifierGroupIds) as string[],
      })),
      modifierGroups: modifierGroups.map((g) => ({
        ...g,
        options: JSON.parse(g.options) as Array<{
          id: string; name: string; priceDelta: number; isDefault?: boolean;
        }>,
      })),
    };
  });

  app.get('/settings/brand', async () => {
    const rows = await prisma.setting.findMany({ where: { key: { startsWith: 'brand.' } } });
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key.replace('brand.', '')] = r.value;
    return out;
  });
}

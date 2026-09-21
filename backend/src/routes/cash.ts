import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../plugins/auth.js';

const Body = z.object({
  type: z.enum(['collection', 'deposit']),
  amount: z.number().int().min(1),
  comment: z.string().default(''),
});

export async function cashRoutes(app: FastifyInstance) {
  app.post('/cash-movements', { preHandler: [requireAuth('barista', 'owner')] }, async (req, reply) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
    const shift = await prisma.shift.findFirst({ where: { status: 'open' } });
    if (!shift) return reply.code(409).send({ error: 'Нет открытой смены' });
    const cm = await prisma.cashMovement.create({
      data: {
        shiftId: shift.id,
        employeeId: req.user!.id,
        type: parsed.data.type,
        amount: parsed.data.amount,
        comment: parsed.data.comment,
      },
      include: { employee: true },
    });
    const { employee, ...cmRest } = cm;
    return { movement: { ...cmRest, employeeName: employee.name } };
  });

  app.get('/cash-movements', { preHandler: [requireAuth('barista', 'owner')] }, async (req) => {
    const shiftId = (req.query as { shiftId?: string }).shiftId;
    const where = shiftId ? { shiftId } : {};
    const cms = await prisma.cashMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: true },
    });
    return {
      movements: cms.map((c) => {
        const { employee, ...rest } = c;
        return { ...rest, employeeName: employee.name };
      }),
    };
  });
}

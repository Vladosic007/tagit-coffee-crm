import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../plugins/auth.js';
import { computeShiftStats } from '../services/reports.js';

const OpenBody = z.object({ cashStart: z.number().int().min(0) });
const CloseBody = z.object({ cashCounted: z.number().int().min(0) });

export async function shiftRoutes(app: FastifyInstance) {
  // Открыть смену
  app.post('/shifts/open', { preHandler: [requireAuth('barista', 'owner')] }, async (req, reply) => {
    const parsed = OpenBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'cashStart required' });
    const existingOpen = await prisma.shift.findFirst({ where: { status: 'open' } });
    if (existingOpen) return reply.code(409).send({ error: 'Смена уже открыта', shiftId: existingOpen.id });
    const shift = await prisma.shift.create({
      data: {
        openedById: req.user!.id,
        cashStart: parsed.data.cashStart,
        status: 'open',
      },
    });
    return { shift };
  });

  // Получить текущую (открытую) смену
  app.get('/shifts/current', { preHandler: [requireAuth('barista', 'owner')] }, async () => {
    const shift = await prisma.shift.findFirst({
      where: { status: 'open' },
      include: { openedBy: true, closedBy: true },
    });
    if (!shift) return { shift: null, stats: null };
    const stats = await computeShiftStats(shift.id);
    const { openedBy, closedBy, ...rest } = shift;
    return {
      shift: {
        ...rest,
        openedByName: openedBy.name,
        closedByName: closedBy?.name ?? null,
      },
      stats,
    };
  });

  // Закрыть смену
  app.post('/shifts/close', { preHandler: [requireAuth('barista', 'owner')] }, async (req, reply) => {
    const parsed = CloseBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'cashCounted required' });
    const shift = await prisma.shift.findFirst({ where: { status: 'open' } });
    if (!shift) return reply.code(404).send({ error: 'Нет открытой смены' });
    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: {
        cashCounted: parsed.data.cashCounted,
        closedAt: new Date(),
        closedById: req.user!.id,
        status: 'closed',
      },
    });
    const stats = await computeShiftStats(updated.id);
    return { shift: updated, stats };
  });

  // Список смен (только владелец)
  app.get('/shifts', { preHandler: [requireAuth('owner')] }, async () => {
    const shifts = await prisma.shift.findMany({
      orderBy: { openedAt: 'desc' },
      include: { openedBy: true, closedBy: true },
    });
    const withStats = await Promise.all(
      shifts.map(async (s) => {
        const { openedBy, closedBy, ...rest } = s;
        return {
          ...rest,
          openedByName: openedBy.name,
          closedByName: closedBy?.name ?? null,
          stats: await computeShiftStats(s.id),
        };
      })
    );
    return { shifts: withStats };
  });

  // Детали смены
  app.get('/shifts/:id', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { openedBy: true, closedBy: true, orders: { include: { items: true } }, cashMovements: { include: { employee: true } } },
    });
    if (!shift) return reply.code(404).send({ error: 'Смена не найдена' });
    const stats = await computeShiftStats(shift.id);
    const { openedBy, closedBy, cashMovements, ...rest } = shift;
    return {
      shift: {
        ...rest,
        openedByName: openedBy.name,
        closedByName: closedBy?.name ?? null,
        cashMovements: cashMovements.map((cm) => {
          const { employee, ...cmRest } = cm;
          return { ...cmRest, employeeName: employee.name };
        }),
      },
      stats,
    };
  });
}

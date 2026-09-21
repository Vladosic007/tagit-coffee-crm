import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../plugins/auth.js';
import { reportForRange } from '../services/reports.js';

const DayQ = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
const PeriodQ = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function reportRoutes(app: FastifyInstance) {
  app.get('/reports/day', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const parsed = DayQ.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'date=YYYY-MM-DD required' });
    const from = new Date(parsed.data.date + 'T00:00:00');
    const to = new Date(from.getTime() + 24 * 3600 * 1000);
    return reportForRange(from, to);
  });

  app.get('/reports/period', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const parsed = PeriodQ.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'from & to (YYYY-MM-DD) required' });
    const from = new Date(parsed.data.from + 'T00:00:00');
    const to = new Date(new Date(parsed.data.to + 'T00:00:00').getTime() + 24 * 3600 * 1000);
    return reportForRange(from, to);
  });
}

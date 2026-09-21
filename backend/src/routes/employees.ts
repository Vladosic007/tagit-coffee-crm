import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../plugins/auth.js';

const CreateBody = z.object({
  name: z.string().min(1),
  role: z.enum(['barista', 'owner']),
  pin: z.string().regex(/^\d{4}$/),
});
const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['barista', 'owner']).optional(),
  pin: z.string().regex(/^\d{4}$/).optional(),
  isActive: z.boolean().optional(),
});

function pubEmp(e: { id: string; name: string; role: string; isActive: boolean; createdAt: Date }) {
  return { id: e.id, name: e.name, role: e.role, isActive: e.isActive, createdAt: e.createdAt };
}

export async function employeeRoutes(app: FastifyInstance) {
  app.get('/employees', { preHandler: [requireAuth('owner')] }, async () => {
    const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'asc' } });
    return { employees: employees.map(pubEmp) };
  });

  app.post('/employees', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
    // Ensure PIN uniqueness
    const all = await prisma.employee.findMany({ where: { isActive: true } });
    for (const e of all) {
      if (await bcrypt.compare(parsed.data.pin, e.pinHash)) {
        return reply.code(409).send({ error: 'PIN уже используется' });
      }
    }
    const pinHash = await bcrypt.hash(parsed.data.pin, 10);
    const emp = await prisma.employee.create({
      data: { name: parsed.data.name, role: parsed.data.role, pinHash },
    });
    return { employee: pubEmp(emp) };
  });

  app.patch('/employees/:id', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = UpdateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.pin) {
      // Ensure PIN uniqueness among other employees
      const others = await prisma.employee.findMany({ where: { isActive: true, NOT: { id } } });
      for (const e of others) {
        if (await bcrypt.compare(parsed.data.pin, e.pinHash)) {
          return reply.code(409).send({ error: 'PIN уже используется' });
        }
      }
      data.pinHash = await bcrypt.hash(parsed.data.pin, 10);
      delete data.pin;
    }
    const emp = await prisma.employee.update({ where: { id }, data });
    return { employee: pubEmp(emp) };
  });

  app.delete('/employees/:id', { preHandler: [requireAuth('owner')] }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    if (id === req.user!.id) {
      return reply.code(400).send({ error: 'Нельзя удалить себя' });
    }
    const emp = await prisma.employee.update({ where: { id }, data: { isActive: false } });
    return { employee: pubEmp(emp) };
  });
}

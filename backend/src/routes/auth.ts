import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const LoginBody = z.object({
  pin: z.string().min(4).max(6).regex(/^\d+$/),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Некорректный PIN' });
    }
    const { pin } = parsed.data;
    const candidates = await prisma.employee.findMany({ where: { isActive: true } });
    for (const emp of candidates) {
      if (await bcrypt.compare(pin, emp.pinHash)) {
        const token = app.jwt.sign(
          { id: emp.id, role: emp.role as 'barista' | 'owner', name: emp.name },
          { expiresIn: '30d' }
        );
        return {
          token,
          employee: { id: emp.id, name: emp.name, role: emp.role },
        };
      }
    }
    return reply.code(401).send({ error: 'Неверный PIN' });
  });

  app.get('/auth/me', { preHandler: [async (r, rep) => { try { await r.jwtVerify(); } catch { rep.code(401).send({ error: 'Не авторизован' }); } }] }, async (req) => {
    const u = req.user!;
    const emp = await prisma.employee.findUnique({ where: { id: u.id } });
    if (!emp || !emp.isActive) throw new Error('Employee not found');
    return { id: emp.id, name: emp.name, role: emp.role };
  });
}

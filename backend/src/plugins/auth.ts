import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function requireAuth(...roles: Array<'barista' | 'owner'>) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Не авторизован' });
    }
    if (roles.length > 0 && !roles.includes(request.user!.role)) {
      return reply.code(403).send({ error: 'Недостаточно прав' });
    }
  };
}

export async function attachAuthHooks(app: FastifyInstance) {
  // no-op; individual routes use preHandler with requireAuth()
}

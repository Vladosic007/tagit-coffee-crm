import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: 'barista' | 'owner'; name: string };
    user: { id: string; role: 'barista' | 'owner'; name: string };
  }
}

export type Role = 'barista' | 'owner';

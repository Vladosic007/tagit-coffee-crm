import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import './types.js';
import { authRoutes } from './routes/auth.js';
import { menuRoutes } from './routes/menu.js';
import { shiftRoutes } from './routes/shifts.js';
import { orderRoutes } from './routes/orders.js';
import { cashRoutes } from './routes/cash.js';
import { reportRoutes } from './routes/reports.js';
import { productRoutes } from './routes/products.js';
import { employeeRoutes } from './routes/employees.js';

const app = Fastify({ logger: { level: 'info' } });

const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-tagit';

await app.register(cors, {
  origin: CORS_ORIGIN.split(',').map((s) => s.trim()),
  credentials: false,
});
await app.register(jwt, { secret: JWT_SECRET });

app.get('/health', async () => ({ status: 'ok', service: 'tagit-coffee-crm', time: new Date().toISOString() }));

await app.register(authRoutes);
await app.register(menuRoutes);
await app.register(shiftRoutes);
await app.register(orderRoutes);
await app.register(cashRoutes);
await app.register(reportRoutes);
await app.register(productRoutes);
await app.register(employeeRoutes);

app.setErrorHandler((error, req, reply) => {
  req.log.error(error);
  if (error.validation) return reply.code(400).send({ error: 'Validation error', details: error.validation });
  reply.code(error.statusCode ?? 500).send({ error: error.message ?? 'Internal error' });
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 TAGIT Coffee API on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CreateBody = z.object({
  name: z.string().min(1),
  role: z.enum(['barista', 'owner']),
  pin: z.string().regex(/^\d{4}$/),
});

function pub(e: { id: string; name: string; role: string; isActive: boolean; createdAt: Date }) {
  return { id: e.id, name: e.name, role: e.role, isActive: e.isActive, createdAt: e.createdAt };
}

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ employees: employees.map(pub) });
}

export async function POST(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const all = await prisma.employee.findMany({ where: { isActive: true } });
  for (const e of all) {
    if (await bcrypt.compare(parsed.data.pin, e.pinHash))
      return NextResponse.json({ error: 'PIN уже используется' }, { status: 409 });
  }
  const pinHash = await bcrypt.hash(parsed.data.pin, 10);
  const emp = await prisma.employee.create({
    data: { name: parsed.data.name, role: parsed.data.role, pinHash },
  });
  return NextResponse.json({ employee: pub(emp) });
}

export const dynamic = 'force-dynamic';

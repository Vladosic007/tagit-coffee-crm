import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const LoginBody = z.object({ pin: z.string().min(4).max(6).regex(/^\d+$/) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Некорректный PIN' }, { status: 400 });
  const candidates = await prisma.employee.findMany({ where: { isActive: true } });
  for (const emp of candidates) {
    if (await bcrypt.compare(parsed.data.pin, emp.pinHash)) {
      const token = await signToken({ id: emp.id, name: emp.name, role: emp.role as 'barista' | 'owner' });
      return NextResponse.json({ token, employee: { id: emp.id, name: emp.name, role: emp.role } });
    }
  }
  return NextResponse.json({ error: 'Неверный PIN' }, { status: 401 });
}

export const dynamic = 'force-dynamic';

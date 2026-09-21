import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['barista', 'owner']).optional(),
  pin: z.string().regex(/^\d{4}$/).optional(),
  isActive: z.boolean().optional(),
});

function pub(e: { id: string; name: string; role: string; isActive: boolean; createdAt: Date }) {
  return { id: e.id, name: e.name, role: e.role, isActive: e.isActive, createdAt: e.createdAt };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const parsed = UpdateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.pin) {
    const others = await prisma.employee.findMany({ where: { isActive: true, NOT: { id: params.id } } });
    for (const e of others) {
      if (await bcrypt.compare(parsed.data.pin, e.pinHash))
        return NextResponse.json({ error: 'PIN уже используется' }, { status: 409 });
    }
    data.pinHash = await bcrypt.hash(parsed.data.pin, 10);
    delete data.pin;
  }
  const emp = await prisma.employee.update({ where: { id: params.id }, data });
  return NextResponse.json({ employee: pub(emp) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  if (params.id === check.user.id)
    return NextResponse.json({ error: 'Нельзя удалить себя' }, { status: 400 });
  const emp = await prisma.employee.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ employee: pub(emp) });
}

export const dynamic = 'force-dynamic';

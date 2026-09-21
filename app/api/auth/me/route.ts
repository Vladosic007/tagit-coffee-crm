import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'barista', 'owner');
  if (check instanceof NextResponse) return check;
  const emp = await prisma.employee.findUnique({ where: { id: check.user.id } });
  if (!emp || !emp.isActive) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: emp.id, name: emp.name, role: emp.role });
}

export const dynamic = 'force-dynamic';

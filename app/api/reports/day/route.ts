import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { reportForRange } from '@/lib/report';

const Q = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function GET(req: NextRequest) {
  const check = await requireRole(req, 'owner');
  if (check instanceof NextResponse) return check;
  const { searchParams } = new URL(req.url);
  const parsed = Q.safeParse({ date: searchParams.get('date') });
  if (!parsed.success) return NextResponse.json({ error: 'date=YYYY-MM-DD required' }, { status: 400 });
  const from = new Date(parsed.data.date + 'T00:00:00');
  const to = new Date(from.getTime() + 24 * 3600 * 1000);
  return NextResponse.json(await reportForRange(from, to));
}

export const dynamic = 'force-dynamic';

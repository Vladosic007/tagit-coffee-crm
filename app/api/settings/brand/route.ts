import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: 'brand.' } } });
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key.replace('brand.', '')] = r.value;
  return NextResponse.json(out);
}

export const dynamic = 'force-dynamic';

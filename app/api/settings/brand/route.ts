import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({ where: { key: { startsWith: 'brand.' } } });
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key.replace('brand.', '')] = r.value;
    return NextResponse.json(out);
  } catch (err) {
    console.error('[api/settings/brand] error:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

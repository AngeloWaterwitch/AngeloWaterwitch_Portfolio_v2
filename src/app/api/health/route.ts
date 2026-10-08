import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public, minimal: never returns error details or data.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[health] database check failed:', (err as Error).message);
    return NextResponse.json({ status: 'degraded' }, { status: 503 });
  }
}

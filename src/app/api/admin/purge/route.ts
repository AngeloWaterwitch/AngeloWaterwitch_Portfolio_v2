import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { purgeExpired } from '@/lib/client-lifecycle';

// GET: how many erased clients' records are still being kept, and when the first ones can be deleted.
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const retained = await prisma.client.findMany({ where: { deletedAt: { not: null } }, select: { id: true, deletedAt: true, retainUntil: true }, orderBy: { retainUntil: 'asc' } });
  return NextResponse.json({
    retained: retained.length,
    due: retained.filter((c) => c.retainUntil && c.retainUntil < new Date()).length,
    nextDue: retained[0]?.retainUntil ?? null,
  });
}

// POST: delete the retained records whose 5-year retention period is over.
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  const result = await purgeExpired();
  await audit('ADMIN', 'admin', 'retention.purge', { clients: result.clients }, clientIp(req));
  return NextResponse.json(result);
}

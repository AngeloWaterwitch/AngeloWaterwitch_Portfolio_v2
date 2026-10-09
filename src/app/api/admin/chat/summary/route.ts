import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { adminChannel } from '@/lib/realtime';
import { callsConfigured, expireStaleRings } from '@/lib/calls';

export const dynamic = 'force-dynamic';

// Polled by the admin dashboard (and nudged instantly by a realtime ping): unread counts and calls ringing for Angelo.
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await expireStaleRings();

  const [unread, ringing, live] = await Promise.all([
    prisma.chatMessage.groupBy({ by: ['clientId'], where: { sender: 'CLIENT', readAt: null }, _count: { _all: true } }),
    prisma.callSession.findMany({
      where: { status: 'RINGING', initiatedBy: 'CLIENT' },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    // calls Angelo can (re)join: live ones, or ones he started that are still ringing
    prisma.callSession.findMany({
      where: { OR: [{ status: 'ACTIVE' }, { status: 'RINGING', initiatedBy: 'ADMIN' }] },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json(
    {
      channel: adminChannel(),
      callsEnabled: callsConfigured(),
      unread: Object.fromEntries(unread.map((u) => [u.clientId, u._count._all])),
      totalUnread: unread.reduce((n, u) => n + u._count._all, 0),
      live: live.map((c) => ({ id: c.id, kind: c.kind, status: c.status, clientId: c.client.id, clientName: c.client.name })),
      incoming: ringing.map((c) => ({ id: c.id, kind: c.kind, clientId: c.client.id, clientName: c.client.name, createdAt: c.createdAt })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

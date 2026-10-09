import { after, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { allowRequest } from '@/lib/ratelimit';
import { cleanMessage, emailOwnerAboutMessage, notifyOtherSide } from '@/lib/chat';
import { clientChannel } from '@/lib/realtime';
import { callsConfigured } from '@/lib/calls';
import { currentCall } from '@/lib/call-actions';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };

const publicMsg = { id: true, sender: true, body: true, createdAt: true, readAt: true } as const;

export async function GET(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401, headers: noStore });

  const afterRaw = req.nextUrl.searchParams.get('after');
  const after = afterRaw ? new Date(afterRaw) : null;
  // Independent queries run together. Opening the conversation also marks Angelo's messages as read.
  const [messages, , call] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { clientId: client.id, ...(after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}) },
      orderBy: { createdAt: after ? 'asc' : 'desc' },
      take: 100,
      select: publicMsg,
    }),
    prisma.chatMessage.updateMany({ where: { clientId: client.id, sender: 'ADMIN', readAt: null }, data: { readAt: new Date() } }),
    currentCall(client.id, 'CLIENT'),
  ]);
  if (!after) messages.reverse();

  return NextResponse.json(
    { channel: clientChannel(client.id), callsEnabled: callsConfigured(), call, messages },
    { headers: noStore },
  );
}

export async function POST(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-chat', 30, '1 m'))) {
    return NextResponse.json({ error: 'You are sending messages too fast. Please slow down.' }, { status: 429 });
  }

  const body = cleanMessage((await req.json().catch(() => ({})))?.body);
  if (!body) return NextResponse.json({ error: 'Type a message first.' }, { status: 400 });

  const message = await prisma.chatMessage.create({ data: { clientId: client.id, sender: 'CLIENT', body }, select: publicMsg });
  notifyOtherSide(client.id, 'CLIENT', 'message');
  after(() => emailOwnerAboutMessage({ id: client.id, name: client.name }, body));
  return NextResponse.json(message, { status: 201 });
}

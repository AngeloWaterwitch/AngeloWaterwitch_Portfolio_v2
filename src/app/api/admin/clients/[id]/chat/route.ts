import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { cleanMessage, notifyOtherSide } from '@/lib/chat';
import { currentCall } from '@/lib/call-actions';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };
const publicMsg = { id: true, sender: true, body: true, createdAt: true, readAt: true } as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const afterRaw = req.nextUrl.searchParams.get('after');
  const after = afterRaw ? new Date(afterRaw) : null;
  const messages = await prisma.chatMessage.findMany({
    where: { clientId: id, ...(after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: after ? 'asc' : 'desc' },
    take: 200,
    select: publicMsg,
  });
  if (!after) messages.reverse();

  await prisma.chatMessage.updateMany({ where: { clientId: id, sender: 'CLIENT', readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ call: await currentCall(id, 'ADMIN'), messages }, { headers: noStore });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (client.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'This contract is finished, so the chat is closed. Reactivate the client to write again.' }, { status: 409 });
  }

  const body = cleanMessage((await req.json().catch(() => ({})))?.body);
  if (!body) return NextResponse.json({ error: 'Type a message first.' }, { status: 400 });

  const message = await prisma.chatMessage.create({ data: { clientId: id, sender: 'ADMIN', body }, select: publicMsg });
  await notifyOtherSide(id, 'ADMIN', 'message');
  return NextResponse.json(message, { status: 201 });
}

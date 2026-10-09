import { prisma } from '@/lib/prisma';
import { notifyOtherSide, postSystemMessage } from '@/lib/chat';
import {
  RING_SECONDS, callsConfigured, createCallToken, expireStaleRings, formatCallLength, livekitUrl, newRoomName,
} from '@/lib/calls';

export type Who = 'ADMIN' | 'CLIENT';
export type CallAction = 'accept' | 'decline' | 'cancel' | 'end' | 'token';
type Result = { status: number; body: Record<string, unknown> };

const fail = (status: number, error: string): Result => ({ status, body: { error } });
const label = (kind: string) => (kind === 'VIDEO' ? 'video' : 'voice');

async function joinInfo(roomName: string, who: Who, clientId: string, clientName: string) {
  const identity = who === 'ADMIN' ? 'admin' : 'client-' + clientId;
  const name = who === 'ADMIN' ? 'Angelo' : clientName;
  return { url: livekitUrl(), token: await createCallToken({ room: roomName, identity, name }) };
}

/** Starts a call from `who` to the other side. Only one call per client at a time. */
export async function startCall(clientId: string, who: Who, kind: 'AUDIO' | 'VIDEO'): Promise<Result> {
  if (!callsConfigured()) return fail(503, 'Calls are not set up yet.');

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true, status: true } });
  if (!client || client.status !== 'ACTIVE') return fail(404, 'Client not found');

  await expireStaleRings(clientId);
  const busy = await prisma.callSession.findFirst({ where: { clientId, status: { in: ['RINGING', 'ACTIVE'] } } });
  if (busy) return fail(409, 'A call is already in progress.');

  const call = await prisma.callSession.create({ data: { clientId, initiatedBy: who, kind, roomName: newRoomName() } });
  await notifyOtherSide(clientId, who, 'call');
  const join = await joinInfo(call.roomName, who, clientId, client.name);
  return { status: 201, body: { callId: call.id, kind, ...join } };
}

/** accept / decline / cancel / end / rejoin (token). `who` is the person making the request. */
export async function callAction(callId: string, clientId: string, who: Who, action: CallAction): Promise<Result> {
  if (!callsConfigured()) return fail(503, 'Calls are not set up yet.');

  await expireStaleRings(clientId);
  const call = await prisma.callSession.findFirst({ where: { id: callId, clientId } });
  if (!call) return fail(404, 'Call not found');
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { name: true } });
  const isCaller = call.initiatedBy === who;
  const now = new Date();

  if (action === 'accept') {
    if (isCaller) return fail(403, 'You cannot answer your own call.');
    const res = await prisma.callSession.updateMany({ where: { id: call.id, status: 'RINGING' }, data: { status: 'ACTIVE', answeredAt: now } });
    if (!res.count) return fail(409, 'This call is no longer ringing.');
    await notifyOtherSide(clientId, who, 'call');
    return { status: 200, body: { callId: call.id, kind: call.kind, ...(await joinInfo(call.roomName, who, clientId, client?.name ?? 'Client')) } };
  }

  if (action === 'decline') {
    if (isCaller) return fail(403, 'You cannot decline your own call.');
    const res = await prisma.callSession.updateMany({ where: { id: call.id, status: 'RINGING' }, data: { status: 'DECLINED', endedAt: now } });
    if (!res.count) return fail(409, 'This call is no longer ringing.');
    await postSystemMessage(clientId, `${label(call.kind)[0].toUpperCase() + label(call.kind).slice(1)} call declined`);
    await notifyOtherSide(clientId, who, 'call');
    return { status: 200, body: { success: true } };
  }

  if (action === 'cancel') {
    if (!isCaller) return fail(403, 'Only the caller can cancel.');
    const res = await prisma.callSession.updateMany({ where: { id: call.id, status: 'RINGING' }, data: { status: 'CANCELLED', endedAt: now } });
    if (!res.count) return fail(409, 'This call is no longer ringing.');
    await postSystemMessage(clientId, `Missed ${label(call.kind)} call from ${call.initiatedBy === 'ADMIN' ? 'Angelo' : client?.name ?? 'the client'}`);
    await notifyOtherSide(clientId, who, 'call');
    return { status: 200, body: { success: true } };
  }

  if (action === 'end') {
    // The caller hanging up while it still rings is a cancel.
    if (call.status === 'RINGING' && isCaller) return callAction(callId, clientId, who, 'cancel');
    const res = await prisma.callSession.updateMany({ where: { id: call.id, status: 'ACTIVE' }, data: { status: 'ENDED', endedAt: now } });
    if (res.count) {
      await postSystemMessage(clientId, `${label(call.kind)[0].toUpperCase() + label(call.kind).slice(1)} call ended · ${formatCallLength(call.answeredAt ?? call.createdAt, now)}`);
      await notifyOtherSide(clientId, who, 'call');
    }
    return { status: 200, body: { success: true } }; // ending twice is harmless
  }

  // token: lets someone who refreshed the page rejoin a call that is still live
  const live = call.status === 'ACTIVE' || (call.status === 'RINGING' && isCaller);
  if (!live) return fail(409, 'This call has ended.');
  return { status: 200, body: { callId: call.id, kind: call.kind, ...(await joinInfo(call.roomName, who, clientId, client?.name ?? 'Client')) } };
}

/** The call (if any) that is ringing for, or live with, this person. One query in the common case (no call). */
export async function currentCall(clientId: string, who: Who) {
  const call = await prisma.callSession.findFirst({
    where: { clientId, status: { in: ['RINGING', 'ACTIVE'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!call) return null;

  // A ring nobody answered in time becomes a missed call.
  if (call.status === 'RINGING' && Date.now() - call.createdAt.getTime() > (RING_SECONDS + 5) * 1000) {
    await expireStaleRings(clientId);
    return null;
  }
  return {
    id: call.id, kind: call.kind, status: call.status,
    incoming: call.status === 'RINGING' && call.initiatedBy !== who,
    outgoing: call.status === 'RINGING' && call.initiatedBy === who,
    createdAt: call.createdAt,
  };
}

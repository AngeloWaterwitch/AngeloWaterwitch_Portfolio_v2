import { randomBytes } from 'node:crypto';
import { AccessToken } from 'livekit-server-sdk';
import { prisma } from '@/lib/prisma';
import { postSystemMessage } from '@/lib/chat';

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');

export const RING_SECONDS = 45;
export const TOKEN_TTL_SECONDS = 2 * 60 * 60;

export function callsConfigured(): boolean {
  return !!(clean(process.env.LIVEKIT_URL) && clean(process.env.LIVEKIT_API_KEY) && clean(process.env.LIVEKIT_API_SECRET));
}

export function livekitUrl(): string {
  return clean(process.env.LIVEKIT_URL);
}

export function newRoomName(): string {
  return 'call-' + randomBytes(12).toString('hex');
}

/** A short-lived token that lets one person join exactly one room. The API secret never leaves the server. */
export async function createCallToken(opts: { room: string; identity: string; name: string }): Promise<string> {
  const at = new AccessToken(clean(process.env.LIVEKIT_API_KEY), clean(process.env.LIVEKIT_API_SECRET), {
    identity: opts.identity,
    name: opts.name.slice(0, 60),
    ttl: TOKEN_TTL_SECONDS,
  });
  at.addGrant({ roomJoin: true, room: opts.room, canPublish: true, canSubscribe: true, canPublishData: false });
  return at.toJwt();
}

/** A ring that nobody answered in time becomes a missed call (and leaves a note in the chat). */
export async function expireStaleRings(clientId?: string) {
  const cutoff = new Date(Date.now() - (RING_SECONDS + 5) * 1000);
  const stale = await prisma.callSession.findMany({
    where: { status: 'RINGING', createdAt: { lt: cutoff }, ...(clientId ? { clientId } : {}) },
  });
  for (const c of stale) {
    const res = await prisma.callSession.updateMany({ where: { id: c.id, status: 'RINGING' }, data: { status: 'MISSED', endedAt: new Date() } });
    if (res.count) await postSystemMessage(c.clientId, `Missed ${c.kind === 'VIDEO' ? 'video' : 'voice'} call from ${c.initiatedBy === 'ADMIN' ? 'Angelo' : 'the client'}`);
  }
}

export function formatCallLength(from: Date, to: Date): string {
  const s = Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min ${s % 60}s` : `${s}s`;
}

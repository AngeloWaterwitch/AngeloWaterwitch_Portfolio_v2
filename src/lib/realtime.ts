import { createHmac } from 'node:crypto';

/**
 * Realtime "pings" over Supabase Broadcast. A ping carries no message text: it only tells the other side to fetch
 * from our own authenticated API. So even someone who learned a channel name could not read anything.
 */

function secret(): string {
  const s = process.env.CLIENT_CODE_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error('CLIENT_CODE_SECRET (or NEXTAUTH_SECRET) must be set');
  return 'realtime-channel:' + s;
}

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');

/** Unguessable channel name for one client's conversation. */
export function clientChannel(clientId: string): string {
  return 'c-' + createHmac('sha256', secret()).update('client:' + clientId).digest('hex').slice(0, 32);
}

/** Unguessable channel the admin dashboard listens on for anything a client does. */
export function adminChannel(): string {
  return 'a-' + createHmac('sha256', secret()).update('admin-inbox').digest('hex').slice(0, 32);
}

export type PingKind = 'message' | 'call';

/** Fire-and-forget. Realtime being down must never break sending a message: the 10s polling fallback covers it. */
export async function ping(topic: string, kind: PingKind, extra: Record<string, unknown> = {}) {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) return;
  try {
    await fetch(url + '/realtime/v1/api/broadcast', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ topic, event: 'ping', payload: { kind, ...extra }, private: false }] }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    console.error('[realtime] ping failed:', (err as Error).message);
  }
}

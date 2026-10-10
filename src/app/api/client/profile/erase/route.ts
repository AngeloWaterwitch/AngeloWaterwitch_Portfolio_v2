import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentClient, clearClientCookie } from '@/lib/client-auth';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { adminChannel, ping } from '@/lib/realtime';
import { eraseClient, emailOwner } from '@/lib/client-lifecycle';

const schema = z.object({ confirm: z.literal('DELETE'), acknowledge: z.literal(true) });

// POPIA right to deletion, done by the client themselves.
export async function POST(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-erase', 3, '1 h'))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Please type DELETE and tick the box to confirm.' }, { status: 400 });

  const name = client.name; // for the owner's email, since the name is wiped by the erasure
  const result = await eraseClient({ clientId: client.id, by: 'CLIENT', ip: clientIp(req) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  await clearClientCookie();
  after(async () => {
    await ping(adminChannel(), 'message', { clientId: client.id });
    await emailOwner(`Client deleted their profile: ${name}`, `${name} deleted their profile and data in the client portal.\nUnfinished projects were cancelled (deposits are non-refundable).\nThe signed agreement, quote, receipts and payment records are kept until ${result.retainUntil.toISOString().slice(0, 10)}, as the law requires.`);
  });
  return NextResponse.json({ success: true, retainUntil: result.retainUntil, keptDocuments: result.keptDocuments, keptPayments: result.keptPayments });
}

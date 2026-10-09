import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { audit } from '@/lib/audit';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { acceptRequiredDocuments } from '@/lib/legal/documents';
import { logEvent } from '@/lib/worklog';

const schema = z.object({
  name: z.string().min(2).max(120),
  agreeContract: z.literal(true),
  agreeNoRefund: z.literal(true),
  agreePrivacy: z.literal(true),
});

const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

export async function POST(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-accept', 10, '10 m'))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again shortly.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please tick all three boxes and type your full name.' }, { status: 400 });
  }

  // The typed name must match the name on file, so the record shows who actually accepted.
  if (norm(parsed.data.name) !== norm(client.name)) {
    return NextResponse.json({ error: `Please type your full name exactly as shown: ${client.name}` }, { status: 400 });
  }

  const ip = clientIp(req);
  const { count, at } = await acceptRequiredDocuments(client.id, client.name, ip, req.headers.get('user-agent'));
  if (count === 0) return NextResponse.json({ error: 'There is nothing waiting for you to accept.' }, { status: 409 });

  await audit('CLIENT', client.id, 'documents.accept', { count }, ip);
  const projects = await prisma.clientProject.findMany({ where: { clientId: client.id }, select: { id: true } });
  for (const p of projects) await logEvent(p.id, 'AGREEMENT', 'The client accepted the agreement and policies electronically');
  return NextResponse.json({ success: true, accepted: count, at });
}

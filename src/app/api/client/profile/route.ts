import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { postSystemMessage, notifyOtherSide } from '@/lib/chat';
import { emailOwner } from '@/lib/client-lifecycle';

const text = (min: number, max: number) => z.string().max(max).transform((s) => sanitise(s)).refine((s) => s.length >= min, { message: `Must be at least ${min} characters` });

const schema = z.object({
  name: text(2, 100),
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  phone: text(0, 40).optional().default(''),
  company: text(0, 120).optional().default(''),
});

// POPIA right to correct personal information. Documents that were already issued keep the details they were signed with.
export async function PATCH(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-profile', 10, '10 m'))) {
    return NextResponse.json({ error: 'Too many changes. Please try again shortly.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue ? `${String(issue.path[0] ?? 'Details')}: ${issue.message}` : 'Please check your details.' }, { status: 400 });
  }
  const d = parsed.data;

  const changed: string[] = [];
  if (d.name !== client.name) changed.push('name');
  if (d.email !== client.email) changed.push('email');
  if ((d.phone || null) !== client.phone) changed.push('phone');
  if ((d.company || null) !== client.company) changed.push('company');
  if (changed.length === 0) return NextResponse.json({ success: true, changed: [] });

  await prisma.client.update({ where: { id: client.id }, data: { name: d.name, email: d.email, phone: d.phone || null, company: d.company || null } });
  await audit('CLIENT', client.id, 'client.profile.update', { clientId: client.id, fields: changed }, clientIp(req));
  await postSystemMessage(client.id, `Contact details updated (${changed.join(', ')}).`);
  notifyOtherSide(client.id, 'CLIENT', 'message');
  after(() => emailOwner(`Client updated their details: ${d.name}`, `${d.name} changed their ${changed.join(', ')} in the client portal.`));
  return NextResponse.json({ success: true, changed });
}

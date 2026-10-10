import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { sanitise } from '@/lib/sanitise';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { notifyOtherSide } from '@/lib/chat';
import { cancelProject, emailOwner } from '@/lib/client-lifecycle';
import { formatRands } from '@/lib/format';

const schema = z.object({
  confirm: z.literal('CANCEL'),
  // Required when a deposit has been paid: the client must say they understand it is not refunded.
  acknowledgeNoRefund: z.boolean().optional().default(false),
  reason: z.string().max(500).optional().default('').transform((s) => sanitise(s)),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-cancel', 5, '10 m'))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again shortly.' }, { status: 429 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Please type CANCEL to confirm.' }, { status: 400 });

  // Ownership first: only this client's own project.
  const project = await prisma.clientProject.findFirst({ where: { id, clientId: client.id }, select: { id: true, title: true, depositPaidAt: true, depositCents: true, currency: true } });
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  if (project.depositPaidAt && !parsed.data.acknowledgeNoRefund) {
    return NextResponse.json({ error: `Please confirm that you understand the deposit of ${formatRands(project.depositCents, project.currency)} is not refunded.` }, { status: 400 });
  }

  const result = await cancelProject({ projectId: id, clientId: client.id, by: 'CLIENT', reason: parsed.data.reason, ip: clientIp(req) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  notifyOtherSide(client.id, 'CLIENT', 'message');
  after(() => emailOwner(`Project cancelled by ${client.name}`, `${client.name} cancelled "${project.title}" in the client portal.\n${result.depositPaid ? `The deposit (${formatRands(project.depositCents, project.currency)}) was paid and is non-refundable.` : 'No deposit had been paid.'}${parsed.data.reason ? '\nReason: ' + parsed.data.reason : ''}`));
  return NextResponse.json({ success: true, depositPaid: result.depositPaid, noticeId: result.noticeId });
}

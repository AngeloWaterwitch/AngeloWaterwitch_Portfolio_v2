import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { audit } from '@/lib/audit';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { buildCheckout, payfastConfigured } from '@/lib/payfast';
import { formatRands } from '@/lib/format';

const schema = z.object({ projectId: z.string().min(1), kind: z.enum(['DEPOSIT', 'FINAL']) });
const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');

export async function POST(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-pay', 10, '10 m'))) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 });
  }
  if (!payfastConfigured()) {
    return NextResponse.json({ error: 'Online payments are not switched on yet. Please contact Angelo to arrange payment by EFT.' }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { projectId, kind } = parsed.data;

  // The project must belong to this client. The amount is worked out here, never taken from the browser.
  const project = await prisma.clientProject.findFirst({ where: { id: projectId, clientId: client.id } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (['CANCELLED'].includes(project.status)) return NextResponse.json({ error: 'This project was cancelled.' }, { status: 409 });

  let amountCents: number;
  if (kind === 'DEPOSIT') {
    if (project.depositPaidAt) return NextResponse.json({ error: 'The deposit has already been paid.' }, { status: 409 });
    if (project.status === 'COMPLETED') return NextResponse.json({ error: 'This project is already completed.' }, { status: 409 });
    amountCents = project.depositCents;

    // The agreement must be accepted first.
    const [contract, waiting] = await Promise.all([
      prisma.clientDocument.findFirst({ where: { clientId: client.id, type: 'CONTRACT', supersededAt: null }, select: { id: true } }),
      prisma.clientDocument.count({ where: { clientId: client.id, requiresAcceptance: true, supersededAt: null, acceptedAt: null } }),
    ]);
    if (!contract) return NextResponse.json({ error: 'Your agreement has not been sent yet. Please ask Angelo to send it.' }, { status: 409 });
    if (waiting > 0) return NextResponse.json({ error: 'Please read and accept your agreement before paying the deposit.' }, { status: 409 });
  } else {
    if (!project.depositPaidAt) return NextResponse.json({ error: 'The deposit must be paid first.' }, { status: 409 });
    if (project.finalPaidAt) return NextResponse.json({ error: 'The final payment has already been paid.' }, { status: 409 });
    if (!['IN_REVIEW', 'COMPLETED'].includes(project.status)) {
      return NextResponse.json({ error: 'The final payment opens once the finished work is ready for your approval.' }, { status: 409 });
    }
    amountCents = project.totalCents - project.depositCents;
  }
  if (amountCents <= 0) return NextResponse.json({ error: 'There is nothing to pay for this step.' }, { status: 409 });

  // Reuse a recent unfinished attempt (so a retry cannot create two payments); retire stale ones.
  const recent = new Date(Date.now() - 60 * 60 * 1000);
  const open = await prisma.payment.findMany({ where: { projectId, kind, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  let payment = open.find((p) => p.createdAt > recent && p.amountCents === amountCents) ?? null;
  const stale = open.filter((p) => p.id !== payment?.id);
  if (stale.length) await prisma.payment.updateMany({ where: { id: { in: stale.map((p) => p.id) } }, data: { status: 'CANCELLED' } });
  if (!payment) {
    payment = await prisma.payment.create({
      data: { projectId, clientId: client.id, kind, amountCents, currency: project.currency, mPaymentId: 'pay_' + randomBytes(9).toString('hex') },
    });
  }

  const [first, ...rest] = client.name.trim().split(/\s+/);
  const checkout = buildCheckout({
    mPaymentId: payment.mPaymentId,
    amountCents,
    itemName: `${kind === 'DEPOSIT' ? 'Deposit' : 'Final payment'}: ${project.title}`,
    itemDescription: `${formatRands(amountCents, project.currency)} for ${project.title}`,
    nameFirst: first || client.name,
    nameLast: rest.join(' '),
    email: client.email,
    siteUrl: clean(process.env.NEXTAUTH_URL) || req.nextUrl.origin,
  });

  await audit('CLIENT', client.id, 'payment.start', { paymentId: payment.id, kind }, clientIp(req));
  return NextResponse.json({ mPaymentId: payment.mPaymentId, action: checkout.action, fields: checkout.fields });
}

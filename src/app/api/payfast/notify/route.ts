import { after, NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { logEvent } from '@/lib/worklog';
import { adminChannel, ping } from '@/lib/realtime';
import { postSystemMessage } from '@/lib/chat';
import { createReceipt, emailDocuments } from '@/lib/legal/documents';
import { formatRands } from '@/lib/format';
import { confirmWithPayfast, isPayfastIp, payfastMode, phpUrlEncode, skipNetworkChecks, verifyItnSignature } from '@/lib/payfast';

export const dynamic = 'force-dynamic';

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');
// Every rejection is written to the audit log (no secrets) so the reason can be read later.
const bad = async (reason: string, extra: Record<string, unknown> = {}, status = 400) => {
  console.warn('[payfast itn] rejected:', reason);
  await audit('SYSTEM', null, 'payment.itn-rejected', { reason, ...extra });
  return new NextResponse(reason, { status });
};
const tail = (v: unknown) => String(v ?? '').slice(-3);

/**
 * PayFast calls this from its own servers when a payment changes. A payment is only marked paid here, and only after
 * four checks: the signature, that the sender is PayFast, that the amount matches, and that PayFast confirms it.
 * The customer's browser returning to our site proves nothing.
 */
export async function POST(req: NextRequest) {
  // Normally a URL-encoded form; PayFast's test tools can send multipart. Field order is part of the signature.
  const multipart = (req.headers.get('content-type') ?? '').includes('multipart/form-data');
  const pairs: [string, string][] = multipart
    ? [...(await req.formData()).entries()].map(([k, v]) => [k, String(v)] as [string, string])
    : ([...new URLSearchParams(await req.text()).entries()] as [string, string][]);
  const data = Object.fromEntries(pairs);
  const ip = clientIp(req);

  // 1. signature
  if (!verifyItnSignature(pairs)) return bad('signature', { fields: pairs.map(([k]) => k).join(',') });

  // 2. the request really comes from PayFast
  // In sandbox the sender's address is only logged: step 4 (PayFast confirming the notification) is what proves it. Live enforces both.
  if (!skipNetworkChecks() && !(await isPayfastIp(ip))) {
    if (payfastMode() === 'live') return bad('source', { ip });
    console.warn('[payfast itn] sandbox sender not in the known ranges:', ip);
  }

  // 3. it is about one of our payments, for our merchant, and the amount matches what we asked for
  if (data.merchant_id !== clean(process.env.PAYFAST_MERCHANT_ID)) return bad('merchant', { gotEnds: tail(data.merchant_id), expectedEnds: tail(clean(process.env.PAYFAST_MERCHANT_ID)) });
  const payment = await prisma.payment.findUnique({ where: { mPaymentId: data.m_payment_id ?? '' } });
  if (!payment) return bad('unknown payment', { mPaymentId: data.m_payment_id });
  const grossCents = Math.round(parseFloat(data.amount_gross ?? 'NaN') * 100);
  if (!Number.isFinite(grossCents) || grossCents !== payment.amountCents) {
    await audit('SYSTEM', null, 'payment.amount-mismatch', { paymentId: payment.id, expected: payment.amountCents, got: grossCents }, ip);
    return bad('amount', { expected: payment.amountCents, got: grossCents });
  }

  // 4. PayFast confirms it sent this notification
  if (!skipNetworkChecks()) {
    const body = pairs.filter(([k]) => k !== 'signature').map(([k, v]) => `${k}=${phpUrlEncode(v)}`).join('&');
    if (!(await confirmWithPayfast(body))) return bad('not confirmed by PayFast', { mPaymentId: data.m_payment_id });
  }

  const status = (data.payment_status ?? '').toUpperCase();

  if (status === 'FAILED' || status === 'CANCELLED') {
    await prisma.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: status === 'FAILED' ? 'FAILED' : 'CANCELLED' } });
    return new NextResponse('OK');
  }
  if (status !== 'COMPLETE') return new NextResponse('OK'); // e.g. PENDING: wait for the final notification

  // Idempotent: only the first COMPLETE notification does the work.
  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: 'COMPLETE' } },
    data: { status: 'COMPLETE', providerRef: data.pf_payment_id ?? null, paidAt: new Date() },
  });
  if (claimed.count === 0) return new NextResponse('OK');

  const project = await prisma.clientProject.findUnique({ where: { id: payment.projectId }, include: { client: { select: { id: true, name: true } } } });
  if (!project) return new NextResponse('OK');
  const now = new Date();
  const already = payment.kind === 'DEPOSIT' ? !!project.depositPaidAt : !!project.finalPaidAt;

  if (already) {
    // Money arrived for something already paid (the client paid twice). Record it and flag it.
    await logEvent(project.id, 'PAYMENT', `A second ${payment.kind === 'DEPOSIT' ? 'deposit' : 'final'} payment of ${formatRands(payment.amountCents, payment.currency)} was received. It will be looked into.`, { visible: false });
    await audit('SYSTEM', null, 'payment.duplicate', { paymentId: payment.id }, ip);
  } else if (payment.kind === 'DEPOSIT') {
    await prisma.clientProject.update({
      where: { id: project.id },
      data: {
        depositPaidAt: now,
        ...(['QUOTED', 'DEPOSIT_PENDING'].includes(project.status) ? { status: 'IN_PROGRESS', startedAt: project.startedAt ?? now } : {}),
      },
    });
    await logEvent(project.id, 'PAYMENT', `Deposit of ${formatRands(payment.amountCents, payment.currency)} received online`);
  } else {
    await prisma.clientProject.update({ where: { id: project.id }, data: { finalPaidAt: now } });
    await logEvent(project.id, 'PAYMENT', `Final payment of ${formatRands(payment.amountCents, payment.currency)} received online. The website can now go live and the files be handed over.`);
  }

  await audit('SYSTEM', null, 'payment.complete', { paymentId: payment.id, kind: payment.kind }, ip);
  await postSystemMessage(project.client.id, `${payment.kind === 'DEPOSIT' ? 'Deposit' : 'Final payment'} of ${formatRands(payment.amountCents, payment.currency)} received. Thank you!`);

  // Slower follow-ups run after we have answered PayFast.
  after(async () => {
    try {
      await ping(adminChannel(), 'message', { clientId: project.client.id });
      const receipt = await createReceipt(payment.id);
      if (receipt) await emailDocuments(project.client.id, [receipt.id]);

      const to = clean(process.env.RESEND_TO_EMAIL);
      const key = clean(process.env.RESEND_API_KEY);
      if (to && key) {
        await new Resend(key).emails.send({
          from: clean(process.env.EMAIL_FROM) || 'Portfolio <onboarding@resend.dev>',
          to,
          subject: `Payment received: ${formatRands(payment.amountCents, payment.currency)} from ${project.client.name}`,
          text: `${project.client.name} paid the ${payment.kind === 'DEPOSIT' ? 'deposit' : 'final payment'} (${formatRands(payment.amountCents, payment.currency)}) for "${project.title}".${already ? '\n\nNOTE: this was a second payment for the same step. Check PayFast.' : ''}`,
        });
      }
    } catch (err) {
      console.error('[payfast itn] follow-up failed:', (err as Error).message);
    }
  });

  return new NextResponse('OK');
}

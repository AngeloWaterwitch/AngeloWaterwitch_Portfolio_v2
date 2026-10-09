import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { PdfWriter } from '@/lib/pdf-writer';
import { formatDateTime } from '@/lib/format';
import { buildCancellation, buildContract, buildNda, buildPrivacy, buildQuote, buildReceipt, TERMS } from './templates';
import { DOC_LABEL, REQUIRES_ACCEPTANCE, type Business, type DocContent, type DocType, type LegalContext } from './types';

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');

export async function loadBusiness(): Promise<Business | null> {
  const row = await prisma.businessProfile.findFirst();
  return row ? (row as unknown as Business) : null;
}

const hash = (c: DocContent) => createHash('sha256').update(JSON.stringify(c)).digest('hex');
const reference = (clientId: string, projectId: string) => `${clientId.slice(-5)}-${projectId.slice(-5)}`.toUpperCase();

async function contextFor(clientId: string, projectId: string): Promise<LegalContext> {
  const [business, client, project] = await Promise.all([
    loadBusiness(),
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.clientProject.findFirst({ where: { id: projectId, clientId } }),
  ]);
  if (!business) throw new Error('BUSINESS_MISSING');
  if (!client || !project) throw new Error('NOT_FOUND');
  return {
    business,
    client: { name: client.name, email: client.email, phone: client.phone, company: client.company },
    project: { title: project.title, description: project.description, totalCents: project.totalCents, depositCents: project.depositCents, currency: project.currency },
    issuedAt: new Date(),
    reference: reference(clientId, projectId),
  };
}

function finish(content: DocContent, ctx: LegalContext, type: DocType, version: number): DocContent {
  return {
    ...content,
    footer: `${ctx.business.tradingName || ctx.business.legalName} - ${DOC_LABEL[type]} - ref ${ctx.reference} - v${version} - template ${TERMS.templateVersion}`,
    snapshot: { title: ctx.project.title, totalCents: ctx.project.totalCents, depositCents: ctx.project.depositCents },
  };
}

/**
 * Issues (or re-issues) the client's document pack for a project. Older versions of the same document are kept but
 * marked superseded, so what a client accepted earlier is never altered.
 */
export async function issueDocuments(clientId: string, projectId: string, opts: { includeNda: boolean }) {
  const ctx = await contextFor(clientId, projectId);
  const types: DocType[] = ['QUOTE', 'CONTRACT', ...(opts.includeNda ? (['NDA'] as DocType[]) : []), 'PRIVACY', 'CANCELLATION'];
  const builders: Record<string, (c: LegalContext) => DocContent> = {
    QUOTE: buildQuote, CONTRACT: buildContract, NDA: buildNda, PRIVACY: buildPrivacy, CANCELLATION: buildCancellation,
  };

  const created = [];
  for (const type of types) {
    const previous = await prisma.clientDocument.findMany({
      where: { clientId, type, supersededAt: null, ...(type === 'PRIVACY' ? {} : { projectId }) },
      select: { id: true, version: true },
    });
    const version = Math.max(0, ...previous.map((d) => d.version)) + 1;
    const content = finish(builders[type](ctx), ctx, type, version);
    const [doc] = await prisma.$transaction([
      prisma.clientDocument.create({
        data: {
          clientId, projectId, type, title: DOC_LABEL[type], version, content: content as any, contentHash: hash(content),
          requiresAcceptance: REQUIRES_ACCEPTANCE.includes(type),
        },
      }),
      ...(previous.length ? [prisma.clientDocument.updateMany({ where: { id: { in: previous.map((d) => d.id) } }, data: { supersededAt: new Date() } })] : []),
    ]);
    created.push(doc);
  }
  return created;
}

/** A payment receipt, created when PayFast confirms a payment. */
export async function createReceipt(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== 'COMPLETE' || !payment.paidAt) return null;

  const existing = await prisma.clientDocument.findFirst({ where: { clientId: payment.clientId, type: 'RECEIPT', content: { path: ['snapshot', 'paymentId'], equals: payment.id } } });
  if (existing) return existing;

  const ctx = await contextFor(payment.clientId, payment.projectId);
  const paidToDate = (await prisma.payment.aggregate({ where: { projectId: payment.projectId, status: 'COMPLETE' }, _sum: { amountCents: true } }))._sum.amountCents ?? payment.amountCents;
  const receiptNo = 'R-' + payment.mPaymentId.slice(-8).toUpperCase();
  const base = buildReceipt(ctx, { receiptNo, kind: payment.kind, amountCents: payment.amountCents, paidAt: payment.paidAt, providerRef: payment.providerRef, paidToDateCents: paidToDate });
  const content = { ...base, footer: `${ctx.business.tradingName || ctx.business.legalName} - Receipt ${receiptNo} - template ${TERMS.templateVersion}`, snapshot: { title: ctx.project.title, totalCents: ctx.project.totalCents, depositCents: ctx.project.depositCents, paymentId: payment.id } };
  return prisma.clientDocument.create({
    data: { clientId: payment.clientId, projectId: payment.projectId, type: 'RECEIPT', title: `${DOC_LABEL.RECEIPT} ${receiptNo}`, version: 1, content: content as any, contentHash: hash(content as DocContent), requiresAcceptance: false },
  });
}

export type StoredDoc = Awaited<ReturnType<typeof prisma.clientDocument.findFirstOrThrow>>;

/** Renders a stored document (and its acceptance record, if any) to a PDF. */
export async function renderPdf(doc: StoredDoc): Promise<Uint8Array> {
  const c = doc.content as unknown as DocContent;
  const w = await PdfWriter.create(c.footer ?? '');
  w.title(c.title, c.subtitle);
  if (c.meta?.length) w.rows(c.meta, 90);
  for (const s of c.sections) {
    if (s.heading) w.heading(s.heading);
    for (const b of s.blocks) {
      if (b.kind === 'p') w.para(b.text);
      else if (b.kind === 'list') w.list(b.items, 'bullet');
      else if (b.kind === 'numbered') w.list(b.items, 'number');
      else w.rows(b.rows);
    }
  }
  if (doc.requiresAcceptance) {
    w.heading('Electronic acceptance record');
    if (doc.acceptedAt) {
      w.rows([
        ['Accepted by', doc.acceptedName ?? ''],
        ['Date and time', formatDateTime(doc.acceptedAt) + ' (South African time)'],
        ['IP address', doc.acceptedIp ?? 'not recorded'],
        ['Document fingerprint', doc.contentHash.slice(0, 32)],
      ], 120);
    } else {
      w.para('Not yet accepted.');
    }
  }
  if (doc.supersededAt) w.para('This version has been replaced by a newer one.', { color: undefined });
  return w.save();
}

/** Records the client's electronic acceptance of every required, current document. */
export async function acceptRequiredDocuments(clientId: string, name: string, ip: string, userAgent: string | null) {
  const when = new Date();
  const res = await prisma.clientDocument.updateMany({
    where: { clientId, requiresAcceptance: true, supersededAt: null, acceptedAt: null },
    data: { acceptedAt: when, acceptedName: name, acceptedIp: ip, acceptedUserAgent: userAgent?.slice(0, 300) ?? null },
  });
  return { count: res.count, at: when };
}

/** Which required documents are still waiting for the client. */
export async function pendingAcceptance(clientId: string) {
  return prisma.clientDocument.findMany({
    where: { clientId, requiresAcceptance: true, supersededAt: null, acceptedAt: null },
    select: { id: true, type: true, title: true },
  });
}

/** True when the document was issued with different amounts or a different title than the project has now. */
export function isStale(doc: { content: unknown }, project: { title: string; totalCents: number; depositCents: number }) {
  const s = (doc.content as DocContent).snapshot;
  return !!s && (s.title !== project.title || s.totalCents !== project.totalCents || s.depositCents !== project.depositCents);
}

// ─── Email ──────────────────────────────────────────────────

export const emailFrom = () => clean(process.env.EMAIL_FROM) || 'Portfolio <onboarding@resend.dev>';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fileName = (d: { type: string; version: number; title: string }) => `${d.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-v${d.version}.pdf`;

/**
 * Emails a client their documents as PDF attachments. Until a domain is verified in Resend, Resend only delivers to the
 * account owner, so this reports a clear reason instead of failing silently. Never throws.
 */
export async function emailDocuments(clientId: string, docIds: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const apiKey = clean(process.env.RESEND_API_KEY);
    if (!apiKey) return { ok: false, error: 'Email is not set up (RESEND_API_KEY is missing).' };

    const [client, business, docs] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      loadBusiness(),
      prisma.clientDocument.findMany({ where: { id: { in: docIds }, clientId } }),
    ]);
    if (!client || docs.length === 0) return { ok: false, error: 'Nothing to send.' };

    const attachments = await Promise.all(docs.map(async (d) => ({ filename: fileName(d), content: Buffer.from(await renderPdf(d)) })));
    const site = clean(process.env.NEXTAUTH_URL).replace(/\/$/, '');
    const dev = business?.tradingName || business?.legalName || 'Angelo Waterwitch';

    const result = await new Resend(apiKey).emails.send({
      from: emailFrom(),
      to: client.email,
      replyTo: business?.email || undefined,
      subject: `Your project documents from ${dev}`,
      attachments,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222">
        <h2 style="color:#cc0033">Your project documents</h2>
        <p>Hi ${esc(client.name.split(' ')[0])},</p>
        <p>Attached are the documents for your project: ${docs.map((d) => esc(d.title)).join(', ')}.</p>
        <p>Please read them, then sign in to your client portal to accept the agreement. The deposit can be paid there once you have accepted.</p>
        ${site ? `<p><a href="${esc(site)}/client/login" style="background:#cc0033;color:#fff;padding:0.6rem 1.2rem;text-decoration:none;border-radius:4px">Open your client portal</a></p>` : ''}
        <p style="color:#777;font-size:13px">Your private access code was given to you separately, so it is not in this email. Reply to this email if you have questions.</p>
        <p>${esc(dev)}</p></div>`,
    });

    if (result.error) {
      const msg = result.error.message || 'The email could not be sent.';
      const hint = /own email|verify a domain|testing emails/i.test(msg)
        ? 'Resend only delivers test emails to your own address until you verify a domain. Verify your domain in Resend, then set EMAIL_FROM.'
        : msg;
      await prisma.clientDocument.updateMany({ where: { id: { in: docs.map((d) => d.id) } }, data: { emailError: hint.slice(0, 300) } });
      return { ok: false, error: hint };
    }
    await prisma.clientDocument.updateMany({ where: { id: { in: docs.map((d) => d.id) } }, data: { emailedAt: new Date(), emailError: null } });
    return { ok: true };
  } catch (err) {
    console.error('[documents] email failed:', (err as Error).message);
    return { ok: false, error: 'The email could not be sent.' };
  }
}

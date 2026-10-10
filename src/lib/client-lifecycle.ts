import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { logEvent, minutesBetween } from '@/lib/worklog';
import { postSystemMessage } from '@/lib/chat';
import { buildCancellationNotice, TERMS } from '@/lib/legal/templates';
import { DOC_LABEL, type LegalContext } from '@/lib/legal/types';
import { loadBusiness } from '@/lib/legal/documents';

/** Financial records the law requires us to keep (tax, Companies Act, Consumer Protection Act) are kept this long. */
export const RETENTION_YEARS = 5;

/** The database can be slow to reach; give multi-step changes room so they finish (or roll back as a whole) instead of timing out. */
const TX_OPTIONS = { timeout: 60_000, maxWait: 20_000 };

type Result<T> = ({ ok: true } & T) | { ok: false; status: number; error: string };

// ─── Cancelling a project ───────────────────────────────────

/**
 * Cancels a project for the client or the admin. Before the deposit is paid it costs nothing; after it, the deposit is
 * non-refundable. Stops all work, cancels anything pending, and leaves a Cancellation Notice for the client.
 */
export async function cancelProject(opts: {
  projectId: string; clientId: string; by: 'CLIENT' | 'ADMIN'; reason?: string; ip?: string; quiet?: boolean;
}): Promise<Result<{ depositPaid: boolean; depositCents: number; noticeId: string | null }>> {
  const project = await prisma.clientProject.findFirst({ where: { id: opts.projectId, clientId: opts.clientId } });
  if (!project) return { ok: false, status: 404, error: 'Project not found.' };
  if (project.status === 'CANCELLED') return { ok: false, status: 409, error: 'This project has already been cancelled.' };
  if (project.status === 'COMPLETED' || project.finalPaidAt) {
    return { ok: false, status: 409, error: 'This project is already complete, so it can no longer be cancelled.' };
  }

  const now = new Date();
  const reason = (opts.reason ?? '').trim().slice(0, 500);
  const running = await prisma.workSession.findMany({ where: { projectId: project.id, endedAt: null }, select: { id: true, startedAt: true } });

  await prisma.$transaction([
    prisma.clientProject.update({ where: { id: project.id }, data: { status: 'CANCELLED', cancelledAt: now, cancelledBy: opts.by, cancelReason: reason || null } }),
    prisma.payment.updateMany({ where: { projectId: project.id, status: 'PENDING' }, data: { status: 'CANCELLED' } }),
    prisma.overtimeRequest.updateMany({ where: { projectId: project.id, status: 'PENDING' }, data: { status: 'CANCELLED', decidedAt: now } }),
    ...running.map((s) => prisma.workSession.update({ where: { id: s.id }, data: { endedAt: now } })),
  ], TX_OPTIONS);

  const depositPaid = !!project.depositPaidAt;
  const who = opts.by === 'CLIENT' ? 'The client cancelled the project' : 'The project was cancelled';
  await logEvent(project.id, 'CANCELLED', `${who}.${depositPaid ? ' The deposit is non-refundable.' : ' No deposit had been paid, so nothing is owed.'}${reason ? ' Reason: ' + reason : ''}`);
  if (!opts.quiet) {
    await postSystemMessage(opts.clientId, opts.by === 'CLIENT' ? `Project "${project.title}" was cancelled by the client.` : `Project "${project.title}" was cancelled.`);
  }
  await audit(opts.by === 'CLIENT' ? 'CLIENT' : 'ADMIN', opts.by === 'CLIENT' ? opts.clientId : 'admin', 'project.cancel', { clientId: opts.clientId, projectId: project.id, depositPaid }, opts.ip);

  // A written record for the client. Skipped (not an error) if the business details have not been filled in.
  let noticeId: string | null = null;
  try {
    const business = await loadBusiness();
    const client = await prisma.client.findUnique({ where: { id: opts.clientId } });
    if (business && client) {
      const paid = (await prisma.payment.aggregate({ where: { projectId: project.id, status: 'COMPLETE' }, _sum: { amountCents: true } }))._sum.amountCents ?? 0;
      const ctx: LegalContext = {
        business: business as unknown as LegalContext['business'],
        client: { name: client.name, email: client.email, phone: client.phone, company: client.company },
        project: { title: project.title, description: project.description, totalCents: project.totalCents, depositCents: project.depositCents, currency: project.currency },
        issuedAt: now,
        reference: `${opts.clientId.slice(-5)}-${project.id.slice(-5)}`.toUpperCase(),
      };
      const content = {
        ...buildCancellationNotice(ctx, { cancelledAt: now, by: opts.by, reason, depositPaidAt: project.depositPaidAt, paidToDateCents: paid }),
        footer: `${business.tradingName || business.legalName} - ${DOC_LABEL.CANCELLATION_NOTICE} - ref ${ctx.reference} - template ${TERMS.templateVersion}`,
        snapshot: { title: project.title, totalCents: project.totalCents, depositCents: project.depositCents },
      };
      const doc = await prisma.clientDocument.create({
        data: { clientId: opts.clientId, projectId: project.id, type: 'CANCELLATION_NOTICE', title: DOC_LABEL.CANCELLATION_NOTICE, version: 1, content: content as any, contentHash: createHash('sha256').update(JSON.stringify(content)).digest('hex'), requiresAcceptance: false },
      });
      noticeId = doc.id;
    }
  } catch (err) {
    console.error('[cancel] notice failed:', (err as Error).message);
  }

  return { ok: true, depositPaid, depositCents: project.depositCents, noticeId };
}

// ─── Data export (POPIA right of access) ────────────────────

/** Everything we hold about a client that is theirs to see, as plain data. Never includes secrets or other clients' data. */
export async function exportClientData(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return null;

  const [projects, documents, chat, calls, logins] = await Promise.all([
    prisma.clientProject.findMany({
      where: { clientId },
      include: {
        updates: { where: { visibleToClient: true }, orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } },
        workSessions: { orderBy: { startedAt: 'asc' } },
        overtimeRequests: { orderBy: { createdAt: 'asc' } },
        logEntries: { where: { visibleToClient: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.clientDocument.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } }),
    prisma.chatMessage.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } }),
    prisma.callSession.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } }),
    prisma.auditLog.findMany({ where: { actorId: clientId, action: 'client.login' }, orderBy: { createdAt: 'asc' }, select: { createdAt: true, ip: true } }),
  ]);

  const rands = (c: number) => Math.round(c) / 100;
  return {
    about: {
      generatedAt: new Date().toISOString(),
      note: 'This is a copy of the personal information held about you in the client portal. Internal working notes are not included; ask the Information Officer if you want them.',
    },
    profile: { name: client.name, email: client.email, phone: client.phone, company: client.company, createdAt: client.createdAt, lastLoginAt: client.lastLoginAt, status: client.status },
    projects: projects.map((p) => ({
      title: p.title, description: p.description, status: p.status, progressPercent: p.progress, currency: p.currency,
      totalAmount: rands(p.totalCents), depositAmount: rands(p.depositCents), depositPaidAt: p.depositPaidAt, finalPaidAt: p.finalPaidAt,
      startedAt: p.startedAt, completedAt: p.completedAt, cancelledAt: p.cancelledAt, cancelledBy: p.cancelledBy, cancelReason: p.cancelReason, createdAt: p.createdAt,
      updates: p.updates.map((u) => ({ at: u.createdAt, title: u.title, details: u.body, progressPercent: u.progress })),
      payments: p.payments.map((x) => ({ kind: x.kind, amount: rands(x.amountCents), status: x.status, provider: x.provider, reference: x.providerRef, paidAt: x.paidAt, createdAt: x.createdAt })),
      workSessions: p.workSessions.map((w) => ({ start: w.startedAt, end: w.endedAt, minutes: w.endedAt ? minutesBetween(w.startedAt, w.endedAt) : null, overtime: w.overtime, summary: w.summary })),
      overtimeRequests: p.overtimeRequests.map((o) => ({ at: o.createdAt, reason: o.reason, estimatedMinutes: o.estimatedMinutes, status: o.status, yourNote: o.clientNote, decidedAt: o.decidedAt })),
      activityLog: p.logEntries.map((l) => ({ at: l.createdAt, message: l.message })),
    })),
    documents: documents.map((d) => ({ type: d.type, title: d.title, version: d.version, issuedAt: d.createdAt, replacedAt: d.supersededAt, acceptedAt: d.acceptedAt, acceptedName: d.acceptedName, acceptedFromIp: d.acceptedIp })),
    messages: chat.map((m) => ({ at: m.createdAt, from: m.sender === 'CLIENT' ? 'you' : m.sender === 'ADMIN' ? 'Angelo' : 'system', text: m.body })),
    calls: calls.map((c) => ({ at: c.createdAt, startedBy: c.initiatedBy === 'CLIENT' ? 'you' : 'Angelo', type: c.kind, outcome: c.status, answeredAt: c.answeredAt, endedAt: c.endedAt })),
    signIns: logins.map((l) => ({ at: l.createdAt, ip: l.ip })),
  };
}

// ─── Erasure (POPIA right to deletion) ──────────────────────

/**
 * Erases a client's personal data. Everything we do not have to keep is deleted at once. The signed agreement, quote,
 * receipts, cancellation notices and payment records are kept (the law requires financial records for 5 years), locked
 * to everyone but the admin, and deleted automatically when the retention period ends.
 */
export async function eraseClient(opts: { clientId: string; by: 'CLIENT' | 'ADMIN'; ip?: string }): Promise<Result<{ retainUntil: Date; keptDocuments: number; keptPayments: number; already?: boolean }>> {
  const client = await prisma.client.findUnique({ where: { id: opts.clientId }, include: { projects: { select: { id: true, status: true } } } });
  if (!client) return { ok: false, status: 404, error: 'Not found.' };
  if (client.deletedAt && client.retainUntil) {
    return { ok: true, retainUntil: client.retainUntil, keptDocuments: 0, keptPayments: 0, already: true };
  }

  // 1. stop all unfinished projects (no refunds, as agreed)
  for (const p of client.projects) {
    if (!['CANCELLED', 'COMPLETED'].includes(p.status)) {
      await cancelProject({ projectId: p.id, clientId: client.id, by: opts.by, reason: 'Profile deleted', ip: opts.ip, quiet: true });
    }
  }

  // 2. delete everything we do not have to keep
  const projectIds = client.projects.map((p) => p.id);
  const now = new Date();
  const retainUntil = new Date(now);
  retainUntil.setFullYear(retainUntil.getFullYear() + RETENTION_YEARS);

  await prisma.$transaction([
    prisma.clientSession.deleteMany({ where: { clientId: client.id } }),
    prisma.chatMessage.deleteMany({ where: { clientId: client.id } }),
    prisma.callSession.deleteMany({ where: { clientId: client.id } }),
    prisma.progressUpdate.deleteMany({ where: { projectId: { in: projectIds } } }),
    prisma.workLogEntry.deleteMany({ where: { projectId: { in: projectIds } } }),
    prisma.workSession.deleteMany({ where: { projectId: { in: projectIds } } }),
    prisma.overtimeRequest.deleteMany({ where: { projectId: { in: projectIds } } }),
    // copies of the standard policies and the NDA are not financial records
    prisma.clientDocument.deleteMany({ where: { clientId: client.id, type: { in: ['NDA', 'PRIVACY', 'CANCELLATION'] } } }),
    // free text the client typed
    prisma.clientProject.updateMany({ where: { clientId: client.id }, data: { cancelReason: null } }),
    prisma.auditLog.deleteMany({ where: { OR: [{ actorId: client.id }, { detail: { path: ['clientId'], equals: client.id } }] } }),
    // wipe the person, keep the row so the retained financial records still have somewhere to belong
    prisma.client.update({
      where: { id: client.id },
      data: {
        name: 'Deleted client', email: `erased-${client.id}@invalid.invalid`, phone: null, company: null,
        accessCodeHash: 'erased-' + randomBytes(24).toString('hex'), accessCodeHint: '----',
        codeExpiresAt: now, status: 'CANCELLED', deletedAt: now, retainUntil,
      },
    }),
  ], TX_OPTIONS);

  const [keptDocuments, keptPayments] = await Promise.all([
    prisma.clientDocument.count({ where: { clientId: client.id } }),
    prisma.payment.count({ where: { clientId: client.id } }),
  ]);
  // A record that an erasure happened (no personal data in it).
  await audit(opts.by === 'CLIENT' ? 'CLIENT' : 'ADMIN', null, 'client.erased', { by: opts.by, retainUntil: retainUntil.toISOString(), keptDocuments, keptPayments }, opts.ip);

  return { ok: true, retainUntil, keptDocuments, keptPayments };
}

/** Deletes the retained records of erased clients once their retention period is over. */
export async function purgeExpired(): Promise<{ clients: number }> {
  const res = await prisma.client.deleteMany({ where: { deletedAt: { not: null }, retainUntil: { lt: new Date() } } });
  return { clients: res.count };
}

/** Emails the owner (best effort, never throws). Used when a client cancels, deletes their profile, or changes details. */
export async function emailOwner(subject: string, text: string) {
  try {
    const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '');
    const to = clean(process.env.RESEND_TO_EMAIL);
    const key = clean(process.env.RESEND_API_KEY);
    if (!to || !key) return;
    const { Resend } = await import('resend');
    await new Resend(key).emails.send({ from: clean(process.env.EMAIL_FROM) || 'Portfolio <onboarding@resend.dev>', to, subject: subject.replace(/[\r\n]+/g, ' ').slice(0, 150), text });
  } catch (err) {
    console.error('[owner email] failed:', (err as Error).message);
  }
}

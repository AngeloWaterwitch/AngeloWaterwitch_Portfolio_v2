import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { emailDocuments, isStale, issueDocuments } from '@/lib/legal/documents';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('issue'), projectId: z.string().min(1), includeNda: z.boolean().optional().default(true), email: z.boolean().optional().default(false) }),
  z.object({ action: z.literal('email'), docIds: z.array(z.string()).min(1).max(20).optional() }),
]);

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const [docs, projects, business] = await Promise.all([
    prisma.clientDocument.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' }, take: 80 }),
    prisma.clientProject.findMany({ where: { clientId: id }, select: { id: true, title: true, totalCents: true, depositCents: true } }),
    prisma.businessProfile.findFirst({ select: { id: true } }),
  ]);
  const byProject = new Map(projects.map((p) => [p.id, p]));

  return NextResponse.json({
    businessReady: !!business,
    documents: docs.map((d) => {
      const proj = d.projectId ? byProject.get(d.projectId) : undefined;
      return {
        id: d.id, type: d.type, title: d.title, version: d.version, projectId: d.projectId, requiresAcceptance: d.requiresAcceptance,
        superseded: !!d.supersededAt, acceptedAt: d.acceptedAt, acceptedName: d.acceptedName, acceptedIp: d.acceptedIp,
        emailedAt: d.emailedAt, emailError: d.emailError, createdAt: d.createdAt,
        stale: !d.supersededAt && d.type !== 'RECEIPT' && !!proj && isStale(d, proj),
      };
    }),
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  const d = parsed.data;

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    if (d.action === 'issue') {
      if (client.status !== 'ACTIVE') return NextResponse.json({ error: 'This contract is finished. Reactivate the client first.' }, { status: 409 });
      const docs = await issueDocuments(id, d.projectId, { includeNda: d.includeNda });
      await audit('ADMIN', 'admin', 'documents.issue', { clientId: id, projectId: d.projectId, count: docs.length }, clientIp(req));
      const emailResult = d.email ? await emailDocuments(id, docs.map((x) => x.id)) : null;
      return NextResponse.json({ issued: docs.length, email: emailResult });
    }

    // email: the current (not superseded) documents unless specific ones were chosen
    const ids = d.docIds ?? (await prisma.clientDocument.findMany({ where: { clientId: id, supersededAt: null, type: { not: 'RECEIPT' } }, select: { id: true } })).map((x) => x.id);
    const result = await emailDocuments(id, ids);
    await audit('ADMIN', 'admin', 'documents.email', { clientId: id, ok: result.ok }, clientIp(req));
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    if ((err as Error).message === 'BUSINESS_MISSING') {
      return NextResponse.json({ error: 'Fill in your business details first (Business & Legal tab). The documents need them.' }, { status: 409 });
    }
    console.error('[admin documents]', (err as Error).message);
    return NextResponse.json({ error: 'Could not issue the documents.' }, { status: 500 });
  }
}

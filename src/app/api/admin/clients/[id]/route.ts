import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { logEvent } from '@/lib/worklog';
import { issueAccessCode, formatAccessCode, normaliseAccessCode, revokeClientAccess } from '@/lib/client-auth';

type Ctx = { params: Promise<{ id: string }> };

const text = (min: number, max: number) => z.string().min(min).max(max).transform((s) => sanitise(s));

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update'),
    name: text(2, 100),
    email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
    phone: text(0, 40).optional().default(''),
    company: text(0, 120).optional().default(''),
  }),
  z.object({ action: z.literal('regenerate-code') }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('reactivate') }),
]);

const detailSelect = {
  id: true, name: true, email: true, phone: true, company: true, status: true,
  accessCodeHint: true, codeIssuedAt: true, codeExpiresAt: true, lastLoginAt: true, createdAt: true, deletedAt: true, retainUntil: true,
  projects: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      updates: { orderBy: { createdAt: 'desc' as const } },
      payments: { orderBy: { createdAt: 'desc' as const }, select: { id: true, kind: true, amountCents: true, status: true, paidAt: true, createdAt: true } },
    },
  },
};

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id }, select: detailSelect });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const ip = clientIp(req);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    if (d.action === 'update') {
      await prisma.client.update({
        where: { id },
        data: { name: d.name, email: d.email, phone: d.phone || null, company: d.company || null },
      });
      await audit('ADMIN', 'admin', 'client.update', { clientId: id }, ip);
    }

    let accessCode: string | undefined;

    if (d.action === 'regenerate-code' || d.action === 'reactivate') {
      if (d.action === 'regenerate-code' && existing.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'This contract is finished. Use Reactivate to give the client access again.' }, { status: 409 });
      }
      const { code, hash, hint } = issueAccessCode();
      await prisma.$transaction([
        prisma.clientSession.deleteMany({ where: { clientId: id } }),
        prisma.client.update({
          where: { id },
          data: { accessCodeHash: hash, accessCodeHint: hint, codeIssuedAt: new Date(), codeExpiresAt: null, status: 'ACTIVE' },
        }),
      ]);
      accessCode = formatAccessCode(normaliseAccessCode(code)!);
      await audit('ADMIN', 'admin', d.action === 'reactivate' ? 'client.reactivate' : 'client.code.regenerate', { clientId: id }, ip);
    }

    if (d.action === 'complete') {
      await prisma.client.update({ where: { id }, data: { status: 'COMPLETED' } });
      await revokeClientAccess(id);
      await audit('ADMIN', 'admin', 'client.complete', { clientId: id }, ip);
      for (const p of await prisma.clientProject.findMany({ where: { clientId: id }, select: { id: true } })) await logEvent(p.id, 'CONTRACT', 'The contract was marked as finished');
    }

    if (d.action === 'cancel') {
      await prisma.$transaction([
        prisma.client.update({ where: { id }, data: { status: 'CANCELLED' } }),
        prisma.clientProject.updateMany({
          where: { clientId: id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'ADMIN' },
        }),
      ]);
      await revokeClientAccess(id);
      await audit('ADMIN', 'admin', 'client.cancel', { clientId: id }, ip);
      for (const p of await prisma.clientProject.findMany({ where: { clientId: id }, select: { id: true } })) await logEvent(p.id, 'CONTRACT', 'The contract was cancelled');
    }

    const client = await prisma.client.findUnique({ where: { id }, select: detailSelect });
    return NextResponse.json({ client, accessCode });
  } catch (err) {
    console.error('[admin client PATCH]', (err as Error).message);
    return NextResponse.json({ error: 'Failed to update the client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  // Clients who paid must not be hard-deleted: payment records have to be kept (5 years). Use "Erase personal data" instead.
  const target = await prisma.client.findUnique({ where: { id }, select: { id: true, deletedAt: true, retainUntil: true } });
  if (target) {
    const paid = await prisma.payment.count({ where: { clientId: id, status: 'COMPLETE' } });
    const retentionOver = !!target.deletedAt && !!target.retainUntil && target.retainUntil < new Date();
    if (paid > 0 && !retentionOver) {
      return NextResponse.json({ error: 'This client has paid, and payment records must be kept for 5 years. Use "Erase personal data" instead: it removes the personal details and keeps only the records the law requires.' }, { status: 409 });
    }
  }

  try {
    await prisma.client.delete({ where: { id } }); // projects, updates and sessions are removed with it
    await audit('ADMIN', 'admin', 'client.delete', { clientId: id }, clientIp(req));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Client not found or could not be deleted' }, { status: 404 });
  }
}

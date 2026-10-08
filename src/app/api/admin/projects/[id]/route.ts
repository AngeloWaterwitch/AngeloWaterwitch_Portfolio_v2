import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { logEvent } from '@/lib/worklog';
import { PROJECT_STATUS_LABEL } from '@/lib/format';

type Ctx = { params: Promise<{ id: string }> };

const text = (min: number, max: number) => z.string().min(min).max(max).transform((s) => sanitise(s));
const rands = z.number().min(0).max(10_000_000);

const schema = z.object({
  title: text(2, 120).optional(),
  description: text(0, 2000).optional(),
  status: z.enum(['QUOTED', 'DEPOSIT_PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  totalRands: rands.optional(),
  depositRands: rands.optional(),
  // Manual marking for payments received outside the site (for example an EFT).
  depositPaid: z.boolean().optional(),
  finalPaid: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const current = await prisma.clientProject.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const total = d.totalRands !== undefined ? Math.round(d.totalRands * 100) : current.totalCents;
  const deposit = d.depositRands !== undefined ? Math.round(d.depositRands * 100) : current.depositCents;
  if (deposit > total) {
    return NextResponse.json({ error: 'The deposit cannot be more than the total.' }, { status: 400 });
  }

  const now = new Date();
  const data: Record<string, unknown> = { totalCents: total, depositCents: deposit };
  if (d.title !== undefined) data.title = d.title;
  if (d.description !== undefined) data.description = d.description;
  if (d.progress !== undefined) data.progress = d.progress;
  if (d.depositPaid !== undefined) data.depositPaidAt = d.depositPaid ? current.depositPaidAt ?? now : null;
  if (d.finalPaid !== undefined) data.finalPaidAt = d.finalPaid ? current.finalPaidAt ?? now : null;

  if (d.status !== undefined) {
    data.status = d.status;
    if (d.status === 'IN_PROGRESS' && !current.startedAt) data.startedAt = now;
    if (d.status === 'COMPLETED') { data.completedAt = current.completedAt ?? now; data.progress = 100; }
    if (d.status === 'CANCELLED') data.cancelledAt = current.cancelledAt ?? now;
  }

  const project = await prisma.clientProject.update({ where: { id }, data });
  await audit('ADMIN', 'admin', 'project.update', { projectId: id, status: project.status }, clientIp(req));

  // Automatic documentation: everything that changes on the project is written to its work log.
  if (project.status !== current.status) {
    await logEvent(id, 'STATUS', `Status changed from "${PROJECT_STATUS_LABEL[current.status]}" to "${PROJECT_STATUS_LABEL[project.status]}"`);
  }
  if (project.progress !== current.progress) await logEvent(id, 'PROGRESS', `Progress updated to ${project.progress}%`);
  if (!!project.depositPaidAt !== !!current.depositPaidAt) {
    await logEvent(id, 'PAYMENT', project.depositPaidAt ? 'Deposit marked as received' : 'Deposit marked as not received');
  }
  if (!!project.finalPaidAt !== !!current.finalPaidAt) {
    await logEvent(id, 'PAYMENT', project.finalPaidAt ? 'Final payment marked as received' : 'Final payment marked as not received');
  }
  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  try {
    await prisma.clientProject.delete({ where: { id } });
    await audit('ADMIN', 'admin', 'project.delete', { projectId: id }, clientIp(req));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

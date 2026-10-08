import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { formatDuration, logEvent } from '@/lib/worklog';

const schema = z.object({
  reason: z.string().min(5).max(1000).transform((s) => sanitise(s)),
  estimatedHours: z.number().min(0.5).max(48),
  plannedFor: z.coerce.date().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const project = await prisma.clientProject.findUnique({ where: { id }, include: { client: { select: { status: true } } } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.client.status !== 'ACTIVE' || ['COMPLETED', 'CANCELLED'].includes(project.status)) {
    return NextResponse.json({ error: 'This project is finished or cancelled.' }, { status: 409 });
  }
  const pending = await prisma.overtimeRequest.findFirst({ where: { projectId: id, status: 'PENDING' } });
  if (pending) {
    return NextResponse.json({ error: 'There is already an overtime request waiting for the client to answer.' }, { status: 409 });
  }

  const estimatedMinutes = Math.round(d.estimatedHours * 60);
  const request = await prisma.overtimeRequest.create({
    data: { projectId: id, reason: d.reason, estimatedMinutes, plannedFor: d.plannedFor ?? null },
  });
  await logEvent(id, 'OVERTIME_REQUESTED', `Overtime declared (about ${formatDuration(estimatedMinutes)}): ${d.reason}. Waiting for the client to confirm whether they require it.`);
  await audit('ADMIN', 'admin', 'overtime.request', { projectId: id, requestId: request.id }, clientIp(req));
  return NextResponse.json(request, { status: 201 });
}

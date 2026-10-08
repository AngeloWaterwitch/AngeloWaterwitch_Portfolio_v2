import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { findOvertimeAllowance, formatDuration, loadWorkData, logEvent, minutesBetween, saTime } from '@/lib/worklog';

type Ctx = { params: Promise<{ id: string }> };

const summary = z.string().max(1000).transform((s) => sanitise(s));

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), overtime: z.boolean().optional().default(false) }),
  z.object({ action: z.literal('stop'), summary: summary.optional().default('') }),
  z.object({
    action: z.literal('manual'),
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date(),
    summary: summary.optional().default(''),
    overtime: z.boolean().optional().default(false),
  }),
]);

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const data = await loadWorkData(id, false);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    sessions: data.sessions,
    active: data.active,
    totals: data.totals,
    overtimeRequests: data.project.overtimeRequests,
    allowance: await findOvertimeAllowance(id).then((a) => (a ? { requestId: a.request.id, remainingMinutes: a.remainingMinutes } : null)),
    log: data.project.logEntries.slice(0, 100),
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const project = await prisma.clientProject.findUnique({
    where: { id },
    include: { client: { select: { status: true } } },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Overtime only counts when the client has said they require it, for the hours they agreed to, within 7 days.
  const needsApproval = async (overtime: boolean) => {
    if (!overtime) return null;
    return (await findOvertimeAllowance(id))?.request ?? null;
  };

  try {
    if (d.action === 'start') {
      if (project.client.status !== 'ACTIVE' || ['COMPLETED', 'CANCELLED'].includes(project.status)) {
        return NextResponse.json({ error: 'This project is finished or cancelled, so work cannot be started.' }, { status: 409 });
      }
      const running = await prisma.workSession.findFirst({ where: { projectId: id, endedAt: null } });
      if (running) return NextResponse.json({ error: 'A work session is already running on this project.' }, { status: 409 });

      const accepted = await needsApproval(d.overtime);
      if (d.overtime && !accepted) {
        return NextResponse.json(
          { error: 'No confirmed overtime is available. Declare overtime and wait for the client to say they require it. An approval covers the hours requested for 7 days.' },
          { status: 409 },
        );
      }

      const session = await prisma.workSession.create({
        data: { projectId: id, startedAt: new Date(), overtime: d.overtime, overtimeRequestId: accepted?.id ?? null },
      });
      await logEvent(id, 'SESSION_START', d.overtime ? 'Overtime work started' : 'Work started', { sessionId: session.id });
      await audit('ADMIN', 'admin', 'work.start', { projectId: id, overtime: d.overtime }, clientIp(req));
      return NextResponse.json(session, { status: 201 });
    }

    if (d.action === 'stop') {
      const running = await prisma.workSession.findFirst({ where: { projectId: id, endedAt: null } });
      if (!running) return NextResponse.json({ error: 'No work session is running.' }, { status: 409 });
      const endedAt = new Date();
      const session = await prisma.workSession.update({ where: { id: running.id }, data: { endedAt, summary: d.summary } });
      const mins = minutesBetween(session.startedAt, endedAt);
      await logEvent(id, 'SESSION_END', `${session.overtime ? 'Overtime work' : 'Work'} ended after ${formatDuration(mins)}${d.summary ? ': ' + d.summary : ''}`, { sessionId: session.id });
      await audit('ADMIN', 'admin', 'work.stop', { projectId: id, minutes: mins }, clientIp(req));
      return NextResponse.json(session);
    }

    // manual entry (for work done while the timer was not running)
    const now = new Date();
    if (d.endedAt <= d.startedAt) return NextResponse.json({ error: 'The end time must be after the start time.' }, { status: 400 });
    if (d.endedAt > new Date(now.getTime() + 60_000)) return NextResponse.json({ error: 'The end time cannot be in the future.' }, { status: 400 });
    if (minutesBetween(d.startedAt, d.endedAt) > 16 * 60) return NextResponse.json({ error: 'A single session cannot be longer than 16 hours.' }, { status: 400 });

    const accepted = await needsApproval(d.overtime);
    if (d.overtime && !accepted) {
      return NextResponse.json({ error: 'No confirmed overtime is available. Declare overtime and wait for the client to say they require it.' }, { status: 409 });
    }
    const session = await prisma.workSession.create({
      data: { projectId: id, startedAt: d.startedAt, endedAt: d.endedAt, summary: d.summary, overtime: d.overtime, overtimeRequestId: accepted?.id ?? null },
    });
    await logEvent(
      id, 'SESSION_MANUAL',
      `${d.overtime ? 'Overtime' : 'Work'} added manually: ${saTime(d.startedAt)} to ${saTime(d.endedAt).slice(11)} (${formatDuration(minutesBetween(d.startedAt, d.endedAt))})${d.summary ? ': ' + d.summary : ''}`,
      { sessionId: session.id },
    );
    await audit('ADMIN', 'admin', 'work.manual', { projectId: id }, clientIp(req));
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error('[admin work]', (err as Error).message);
    return NextResponse.json({ error: 'Failed to update the work session' }, { status: 500 });
  }
}

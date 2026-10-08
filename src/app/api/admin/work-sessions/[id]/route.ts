import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { formatDuration, logEvent, minutesBetween, saTime } from '@/lib/worklog';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const session = await prisma.workSession.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.workSession.delete({ where: { id } });
  // The log keeps a visible record that a session was removed, so the history stays honest.
  await logEvent(
    session.projectId, 'SESSION_REMOVED',
    `A work session was removed (${saTime(session.startedAt)}, ${formatDuration(minutesBetween(session.startedAt, session.endedAt ?? new Date()))}${session.overtime ? ', overtime' : ''})`,
  );
  await audit('ADMIN', 'admin', 'work.delete', { projectId: session.projectId, sessionId: id }, clientIp(req));
  return NextResponse.json({ success: true });
}

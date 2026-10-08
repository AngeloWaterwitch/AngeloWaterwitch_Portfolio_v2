import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { minutesBetween } from '@/lib/worklog';

export const dynamic = 'force-dynamic';

// Polled by the dashboard so a client sees "working now" and overtime requests without reloading.
export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const projects = await prisma.clientProject.findMany({
    where: { clientId: client.id },
    select: {
      id: true, status: true, progress: true, updatedAt: true,
      workSessions: { select: { startedAt: true, endedAt: true, overtime: true } },
      overtimeRequests: { where: { status: 'PENDING' }, select: { id: true, reason: true, estimatedMinutes: true, plannedFor: true, createdAt: true } },
    },
  });

  const now = new Date();
  const out = projects.map((p) => {
    const active = p.workSessions.find((s) => !s.endedAt) ?? null;
    const mins = (s: { startedAt: Date; endedAt: Date | null }) => minutesBetween(s.startedAt, s.endedAt ?? now);
    return {
      id: p.id,
      status: p.status,
      progress: p.progress,
      active: active ? { startedAt: active.startedAt, overtime: active.overtime } : null,
      lastWorkedAt: p.workSessions.map((s) => s.endedAt ?? s.startedAt).sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
      totalMinutes: p.workSessions.reduce((n, s) => n + mins(s), 0),
      overtimeMinutes: p.workSessions.filter((s) => s.overtime).reduce((n, s) => n + mins(s), 0),
      pendingOvertime: p.overtimeRequests[0] ?? null,
    };
  });

  return NextResponse.json({ now, projects: out }, { headers: { 'Cache-Control': 'no-store' } });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { logEvent } from '@/lib/worklog';

// Withdraws an overtime request the client has not answered yet.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const request = await prisma.overtimeRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only a request that is still waiting for the client can be withdrawn.' }, { status: 409 });
  }

  await prisma.overtimeRequest.update({ where: { id }, data: { status: 'CANCELLED', decidedAt: new Date() } });
  await logEvent(request.projectId, 'OVERTIME_CANCELLED', 'The overtime request was withdrawn.');
  await audit('ADMIN', 'admin', 'overtime.cancel', { projectId: request.projectId, requestId: id }, clientIp(req));
  return NextResponse.json({ success: true });
}

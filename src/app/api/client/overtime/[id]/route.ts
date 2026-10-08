import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { formatDuration, logEvent } from '@/lib/worklog';

const schema = z.object({
  decision: z.enum(['ACCEPTED', 'DECLINED']),
  note: z.string().max(500).optional().default('').transform((s) => sanitise(s)),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // Only JSON from our own pages, never a cross-site form post.
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-overtime', 20, '10 m'))) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  const d = parsed.data;

  // The request must belong to one of this client's own projects.
  const request = await prisma.overtimeRequest.findFirst({
    where: { id, project: { clientId: client.id } },
  });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'This request has already been answered or withdrawn.' }, { status: 409 });
  }

  // updateMany with the status in the filter makes a double-click or race harmless.
  const res = await prisma.overtimeRequest.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: d.decision, clientNote: d.note, decidedAt: new Date() },
  });
  if (res.count === 0) return NextResponse.json({ error: 'This request has already been answered.' }, { status: 409 });

  await logEvent(
    request.projectId, 'OVERTIME_DECISION',
    d.decision === 'ACCEPTED'
      ? `The client confirmed they require the overtime (about ${formatDuration(request.estimatedMinutes)}).${d.note ? ' Note: ' + d.note : ''}`
      : `The client said the overtime is not required.${d.note ? ' Note: ' + d.note : ''}`,
  );
  await audit('CLIENT', client.id, 'overtime.' + d.decision.toLowerCase(), { requestId: id }, clientIp(req));
  return NextResponse.json({ success: true, status: d.decision });
}

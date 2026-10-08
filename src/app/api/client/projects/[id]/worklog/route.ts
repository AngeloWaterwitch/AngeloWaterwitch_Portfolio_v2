import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { loadWorkData, toCsv, toPdf } from '@/lib/worklog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;

  // Ownership check first: a client can only ever download their own project's log.
  const owns = await prisma.clientProject.findFirst({ where: { id, clientId: client.id }, select: { id: true } });
  if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await loadWorkData(id, true);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const slug = data.project.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'project';
  const format = req.nextUrl.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv';
  await audit('CLIENT', client.id, 'worklog.download', { projectId: id, format }, clientIp(req));

  if (format === 'pdf') {
    const pdf = await toPdf(data);
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="work-log-${slug}.pdf"`, 'Cache-Control': 'no-store' },
    });
  }
  return new NextResponse(toCsv(data), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="work-log-${slug}.csv"`, 'Cache-Control': 'no-store' },
  });
}

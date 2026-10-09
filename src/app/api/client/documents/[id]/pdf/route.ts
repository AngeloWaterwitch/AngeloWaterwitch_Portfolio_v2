import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { renderPdf } from '@/lib/legal/documents';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;

  // Only the client's own documents.
  const doc = await prisma.clientDocument.findFirst({ where: { id, clientId: client.id } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await audit('CLIENT', client.id, 'documents.download', { documentId: id }, clientIp(req));
  const pdf = await renderPdf(doc);
  const name = `${doc.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-v${doc.version}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
  });
}

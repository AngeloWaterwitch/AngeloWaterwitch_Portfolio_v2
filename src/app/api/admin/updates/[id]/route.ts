import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  try {
    await prisma.progressUpdate.delete({ where: { id } });
    await audit('ADMIN', 'admin', 'project.update.delete', { updateId: id }, clientIp(req));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

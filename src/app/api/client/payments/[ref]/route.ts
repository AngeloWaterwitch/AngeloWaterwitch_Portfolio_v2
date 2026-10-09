import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentClient } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

// After PayFast sends the browser back, the page asks here whether PayFast's server confirmation has arrived yet.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { ref } = await params;

  const payment = await prisma.payment.findFirst({
    where: { mPaymentId: ref, clientId: client.id },
    select: { status: true, kind: true, amountCents: true, paidAt: true },
  });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(payment, { headers: { 'Cache-Control': 'no-store' } });
}

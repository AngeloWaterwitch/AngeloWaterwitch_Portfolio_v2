import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { clientIp } from '@/lib/ratelimit';
import { eraseClient } from '@/lib/client-lifecycle';

const schema = z.object({ confirm: z.literal('ERASE') });

// Erases a client's personal data on their request, while keeping the financial records the law requires.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Type ERASE to confirm.' }, { status: 400 });

  const result = await eraseClient({ clientId: id, by: 'ADMIN', ip: clientIp(req) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, retainUntil: result.retainUntil, keptDocuments: result.keptDocuments, keptPayments: result.keptPayments, already: !!result.already });
}

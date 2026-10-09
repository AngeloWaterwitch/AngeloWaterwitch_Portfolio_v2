import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { callAction } from '@/lib/call-actions';

const schema = z.object({ action: z.enum(['accept', 'decline', 'cancel', 'end', 'token']) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const call = await prisma.callSession.findUnique({ where: { id }, select: { clientId: true } });
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const r = await callAction(id, call.clientId, 'ADMIN', parsed.data.action);
  return NextResponse.json(r.body, { status: r.status });
}

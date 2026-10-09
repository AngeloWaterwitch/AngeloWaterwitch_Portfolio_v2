import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentClient } from '@/lib/client-auth';
import { allowRequest } from '@/lib/ratelimit';
import { callAction } from '@/lib/call-actions';

const schema = z.object({ action: z.enum(['accept', 'decline', 'cancel', 'end', 'token']) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-call-action', 40, '10 m'))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  // callAction only finds calls that belong to this client, so one client can never touch another's call.
  const r = await callAction(id, client.id, 'CLIENT', parsed.data.action);
  return NextResponse.json(r.body, { status: r.status });
}

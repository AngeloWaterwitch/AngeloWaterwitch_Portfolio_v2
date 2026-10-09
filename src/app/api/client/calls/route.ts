import { NextRequest, NextResponse } from 'next/server';
import { getCurrentClient } from '@/lib/client-auth';
import { allowRequest } from '@/lib/ratelimit';
import { startCall } from '@/lib/call-actions';

export async function POST(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request' }, { status: 415 });
  }
  if (!(await allowRequest(req, 'client-call', 6, '10 m'))) {
    return NextResponse.json({ error: 'Too many call attempts. Please wait a few minutes.' }, { status: 429 });
  }

  const kind = (await req.json().catch(() => ({})))?.kind === 'VIDEO' ? 'VIDEO' : 'AUDIO';
  const r = await startCall(client.id, 'CLIENT', kind);
  return NextResponse.json(r.body, { status: r.status });
}

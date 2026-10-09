import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { startCall } from '@/lib/call-actions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const kind = (await req.json().catch(() => ({})))?.kind === 'VIDEO' ? 'VIDEO' : 'AUDIO';
  const r = await startCall(id, 'ADMIN', kind);
  return NextResponse.json(r.body, { status: r.status });
}

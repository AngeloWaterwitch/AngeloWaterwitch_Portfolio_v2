import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const { url } = await req.json();
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
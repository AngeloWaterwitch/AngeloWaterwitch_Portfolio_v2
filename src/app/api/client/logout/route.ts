import { NextResponse } from 'next/server';
import { endClientSession } from '@/lib/client-auth';

export async function POST() {
  await endClientSession();
  return NextResponse.json({ success: true });
}

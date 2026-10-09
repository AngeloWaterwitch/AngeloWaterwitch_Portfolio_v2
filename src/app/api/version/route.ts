import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Returns which build is currently deployed. Open pages compare it with the build they were loaded from.
export function GET() {
  return NextResponse.json({ id: process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev' }, { headers: { 'Cache-Control': 'no-store' } });
}

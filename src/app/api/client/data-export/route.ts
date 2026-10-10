import { NextRequest, NextResponse } from 'next/server';
import { getCurrentClient } from '@/lib/client-auth';
import { audit } from '@/lib/audit';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { exportClientData } from '@/lib/client-lifecycle';

export const dynamic = 'force-dynamic';

// POPIA right of access: a complete copy of the client's own data, as a downloadable file.
export async function GET(req: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!(await allowRequest(req, 'client-export', 5, '10 m'))) {
    return NextResponse.json({ error: 'Too many downloads. Please try again shortly.' }, { status: 429 });
  }

  const data = await exportClientData(client.id);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit('CLIENT', client.id, 'client.export', { clientId: client.id }, clientIp(req));

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}

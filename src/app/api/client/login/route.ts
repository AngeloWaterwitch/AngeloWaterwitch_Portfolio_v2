import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { allowRequest, clientIp } from '@/lib/ratelimit';
import { audit } from '@/lib/audit';
import {
  createClientSession,
  hashAccessCode,
  normaliseAccessCode,
  setClientCookie,
} from '@/lib/client-auth';

const GENERIC = 'That access code is not valid, or it has expired. Check it and try again.';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  try {
    if (!(await allowRequest(req, 'client-login', 10, '15 m'))) {
      return NextResponse.json({ error: 'Too many attempts. Please wait 15 minutes and try again.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));

    const captcha = await verifyRecaptcha(body?.recaptchaToken, 'client_login');
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Security check failed. Please reload the page and try again.' }, { status: 403 });
    }

    const normalised = normaliseAccessCode(typeof body?.code === 'string' ? body.code.slice(0, 64) : '');
    const client = normalised
      ? await prisma.client.findUnique({ where: { accessCodeHash: hashAccessCode(normalised) } })
      : null;

    const now = new Date();
    const valid =
      !!client && client.status === 'ACTIVE' && (!client.codeExpiresAt || client.codeExpiresAt > now);

    if (!client || !valid) {
      await audit('SYSTEM', null, 'client.login.failed', { reason: client ? 'inactive-or-expired' : 'unknown-code' }, ip);
      return NextResponse.json({ error: GENERIC }, { status: 401 });
    }

    const { token, expiresAt } = await createClientSession(client.id, ip, req.headers.get('user-agent'));
    await setClientCookie(token, expiresAt);
    await prisma.client.update({ where: { id: client.id }, data: { lastLoginAt: now } });
    await audit('CLIENT', client.id, 'client.login', undefined, ip);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[client login]', (err as Error).message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

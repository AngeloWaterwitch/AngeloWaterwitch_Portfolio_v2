import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
 
const resend = new Resend(process.env.RESEND_API_KEY);
 
async function verifyRecaptcha(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[reCAPTCHA] Skipping in development');
    return true;
  }
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  });
  const data = await res.json();
  console.log('[reCAPTCHA response]', JSON.stringify(data));
  return data.success && data.score >= 0.5;
}
 
export async function POST(req: NextRequest) {
  try {
    const { email, reason, recaptchaToken } = await req.json();
 
    if (!email || !reason || !recaptchaToken) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
 
    // 1. Verify reCAPTCHA
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed.' }, { status: 403 });
    }
 
    // 2. Set token expiry to 48 hours from now
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
 
    // 3. Save request to DB
    console.log('[resume/download] Attempting DB write with:', { email, reason, tokenExpiry });
    const request = await prisma.resumeRequest.create({
      data: {
        email,
        reason,
        tokenExpiry,
        ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    });
    console.log('[resume/download] DB write success, token:', request.token);
 
    // 4. Log activity
    await prisma.activityLog.create({
      data: {
        action: 'resume_request',
        detail: `Resume request from ${email} - "${reason.slice(0, 80)}"`,
      },
    });
 
    // 5. Build approve / deny URLs
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const approveUrl = `${baseUrl}/api/resume/request/approve?token=${request.token}`;
    const denyUrl = `${baseUrl}/api/resume/request/deny?token=${request.token}`;
 
    // 6. Email Angelo
    await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.RESEND_TO_EMAIL!,
      subject: `CV Request - ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;background:#111;color:#f0ede8;border-radius:6px;">
          <h2 style="color:#ff3366;margin-top:0;">New CV Request</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Requested:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
          <p><strong>Token expires:</strong> 48 hours from now</p>
          <div style="margin:2rem 0;">
            <a href="${approveUrl}" style="display:inline-block;margin-right:1rem;padding:0.75rem 1.5rem;background:#22c55e;color:#fff;text-decoration:none;border-radius:4px;font-weight:700;">
              Approve
            </a>
            <a href="${denyUrl}" style="display:inline-block;padding:0.75rem 1.5rem;background:#ef4444;color:#fff;text-decoration:none;border-radius:4px;font-weight:700;">
              Deny
            </a>
          </div>
          <p style="color:#555;font-size:0.75rem;">These links are one-time use. The download link expires 48 hours after approval.</p>
        </div>
      `,
    });
 
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[resume/download] FULL ERROR:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
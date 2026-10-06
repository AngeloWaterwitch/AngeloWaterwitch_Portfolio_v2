import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';
import { Resend } from 'resend';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { allowRequest } from '@/lib/ratelimit';

const messageSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  message: z.string().min(10).max(5000),
});

const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await allowRequest(req, 'contact', 5, '10 m'))) {
      return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();

    if (body.honeypot) {
      return NextResponse.json({ success: true });
    }

    const captcha = await verifyRecaptcha(body.recaptchaToken, 'contact');
    if (!captcha.ok) {
      return NextResponse.json({ error: 'Security check failed. Please reload and try again.' }, { status: 403 });
    }

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const clean = sanitiseObject(parsed.data);

    // Save first, but never lose the message if the database is down: the email still goes out.
    let saved: unknown = null;
    try {
      saved = await prisma.contactMessage.create({ data: clean });
    } catch (dbErr) {
      console.error('[contact] database save failed:', (dbErr as Error).message);
    }

    // Awaited: serverless functions can be frozen before an un-awaited send completes.
    let emailed = false;
    try {
      const result = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.RESEND_TO_EMAIL!,
      replyTo: clean.email,
      subject: `New message from ${clean.name.replace(/[\r\n]+/g, ' ')}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc1e3c">New Contact Message</h2>
          <p><strong>From:</strong> ${esc(clean.name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${esc(clean.email)}">${esc(clean.email)}</a></p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #dc1e3c;padding-left:1rem;color:#555">
            ${clean.message.replace(/\n/g, '<br/>')}
          </blockquote>
          <p style="margin-top:2rem">
            <a href="mailto:${esc(clean.email)}?subject=Re:%20Your%20message"
              style="background:#dc1e3c;color:#fff;padding:0.6rem 1.2rem;text-decoration:none;border-radius:4px">
              Reply to ${esc(clean.name)}
            </a>
          </p>
        </div>
      `,
      });
      emailed = !result.error;
      if (result.error) console.error('[contact] email failed:', result.error.message);
    } catch (mailErr) {
      console.error('[contact] email failed:', (mailErr as Error).message);
    }

    if (!saved && !emailed) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 503 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
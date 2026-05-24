import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';
import { Resend } from 'resend';

const messageSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const body = await req.json();

    if (body.honeypot) {
      return NextResponse.json({ success: true });
    }

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const clean = sanitiseObject(parsed.data);
    const message = await prisma.contactMessage.create({ data: clean });

    resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.RESEND_TO_EMAIL!,
      subject: `New message from ${clean.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc1e3c">New Contact Message</h2>
          <p><strong>From:</strong> ${clean.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${clean.email}">${clean.email}</a></p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #dc1e3c;padding-left:1rem;color:#555">
            ${clean.message.replace(/\n/g, '<br/>')}
          </blockquote>
          <p style="margin-top:2rem">
            <a href="mailto:${clean.email}?subject=Re: Your message&body=Hi ${clean.name},"
              style="background:#dc1e3c;color:#fff;padding:0.6rem 1.2rem;text-decoration:none;border-radius:4px">
              Reply to ${clean.name}
            </a>
          </p>
        </div>
      `,
    }).catch(e => console.error('[Resend contact]', e));

    return NextResponse.json(message);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
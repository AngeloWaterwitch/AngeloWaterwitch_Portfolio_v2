import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';
import { Resend } from 'resend';

const testimonialSchema = z.object({
  quote: z.string().min(10),
  author: z.string().min(2),
  role: z.string().optional(),
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const testimonials = await prisma.testimonial.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // NOTE: no requireAuth here — visitors submit testimonials publicly
  try {
    const body = await req.json();
    const parsed = testimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const clean = sanitiseObject(parsed.data);
    const testimonial = await prisma.testimonial.create({
      data: { ...clean, status: 'PENDING' },
    });

    // Notify Angelo — non-blocking
    resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.RESEND_TO_EMAIL!,
      subject: `New testimonial from ${clean.author}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc1e3c">New Testimonial Submission</h2>
          <p><strong>From:</strong> ${clean.author}${clean.role ? `, ${clean.role}` : ''}</p>
          <blockquote style="border-left:3px solid #dc1e3c;padding-left:1rem;color:#555;font-style:italic">
            "${clean.quote}"
          </blockquote>
          <p style="margin-top:2rem">
            <a href="${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/admin"
              style="background:#dc1e3c;color:#fff;padding:0.6rem 1.2rem;text-decoration:none;border-radius:4px">
              Review in Admin →
            </a>
          </p>
        </div>
      `,
    }).catch(e => console.error('[Resend testimonial]', e));

    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }
}
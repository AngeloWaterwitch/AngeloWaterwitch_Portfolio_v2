import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';

const testimonialSchema = z.object({
  quote: z.string().min(10),
  author: z.string().min(2),
  role: z.string().optional(),
});

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
  const { error } = await requireAuth();
  if (error) return error;

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
    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }
}
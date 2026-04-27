import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';

const heroSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  sub: z.string().min(1),
  resumeEnabled: z.boolean().optional(),
  resumeUrl: z.string().optional(),
  resumeLabel: z.string().optional(),
});

export async function GET() {
  try {
    const hero = await prisma.heroContent.findFirst();
    return NextResponse.json(hero);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hero' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = heroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const clean = sanitiseObject(parsed.data);
    const existing = await prisma.heroContent.findFirst();

    const hero = existing
      ? await prisma.heroContent.update({ where: { id: existing.id }, data: clean })
      : await prisma.heroContent.create({ data: clean });

    return NextResponse.json(hero);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update hero' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';

const skillSchema = z.object({
  icon: z.string().min(1),
  name: z.string().min(1),
  order: z.number().optional(),
});

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(skills);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = skillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const clean = sanitiseObject(parsed.data);
    const skill = await prisma.skill.create({ data: clean });
    return NextResponse.json(skill);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const skills = z.array(z.object({
      id: z.string(),
      icon: z.string(),
      name: z.string(),
      order: z.number(),
    })).safeParse(body);

    if (!skills.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    await Promise.all(
      skills.data.map(skill =>
        prisma.skill.update({
          where: { id: skill.id },
          data: {
            icon: skill.icon,
            name: skill.name,
            order: skill.order,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update skills' }, { status: 500 });
  }
}
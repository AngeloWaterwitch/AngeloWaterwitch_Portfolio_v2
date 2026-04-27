import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';
import { z } from 'zod';

const projectSchema = z.object({
  title: z.string().min(1),
  desc: z.string().min(1),
  tags: z.array(z.string()),
  link: z.string().optional(),
  order: z.number().optional(),
});

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { order: 'asc' },
      include: { media: true },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { tags, ...rest } = parsed.data;
    const project = await prisma.project.create({
      data: {
        ...sanitiseObject(rest),
        tags,
      },
      include: { media: true },
    });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
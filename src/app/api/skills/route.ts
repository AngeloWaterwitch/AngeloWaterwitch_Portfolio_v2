import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { order: 'asc' } });
    revalidatePath('/');
    return NextResponse.json(skills);
  } catch {
    revalidatePath('/');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const skill = await prisma.skill.create({ data: body });
    revalidatePath('/');
    return NextResponse.json(skill);
  } catch {
    revalidatePath('/');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const skills = await req.json();
    await Promise.all(
      skills.map((skill: any, index: number) =>
        prisma.skill.update({
          where: { id: skill.id },
          data: {
            icon: skill.icon,
            name: skill.name,
            order: index + 1,
          },
        })
      )
    );
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    revalidatePath('/');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const existing = await prisma.sEOSettings.findFirst();
    const seo = existing
      ? await prisma.sEOSettings.update({ where: { id: existing.id }, data: body })
      : await prisma.sEOSettings.create({ data: body });
      revalidatePath('/');
    return NextResponse.json(seo);
  } catch {
    revalidatePath('/');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
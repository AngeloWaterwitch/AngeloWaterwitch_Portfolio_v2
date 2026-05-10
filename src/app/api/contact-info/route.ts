import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const existing = await prisma.contactInfo.findFirst();
    const contact = existing
      ? await prisma.contactInfo.update({ where: { id: existing.id }, data: body })
      : await prisma.contactInfo.create({ data: body });
    revalidatePath('/');
    return NextResponse.json(contact);
  } catch {
    revalidatePath('/');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const existing = await prisma.branding.findFirst();
    const branding = existing
      ? await prisma.branding.update({ where: { id: existing.id }, data: body })
      : await prisma.branding.create({ data: body });
    return NextResponse.json(branding);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
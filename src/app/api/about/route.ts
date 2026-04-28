import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitiseObject } from '@/lib/sanitise';

export async function GET() {
  try {
    const about = await prisma.aboutContent.findFirst();
    return NextResponse.json(about);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const clean = sanitiseObject(body);
    const existing = await prisma.aboutContent.findFirst();
    const about = existing
      ? await prisma.aboutContent.update({ where: { id: existing.id }, data: clean })
      : await prisma.aboutContent.create({ data: clean });
    return NextResponse.json(about);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
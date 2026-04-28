import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const media = await prisma.projectMedia.create({ data: body });
    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
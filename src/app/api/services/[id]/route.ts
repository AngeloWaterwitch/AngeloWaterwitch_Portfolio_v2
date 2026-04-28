import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const service = await prisma.service.update({ where: { id: params.id }, data: body });
    return NextResponse.json(service);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
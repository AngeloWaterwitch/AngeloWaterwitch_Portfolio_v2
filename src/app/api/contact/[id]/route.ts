import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const message = await prisma.contactMessage.update({
      where: { id: params.id },
      data: { read: body.read },
    });
    return NextResponse.json(message);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await prisma.contactMessage.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
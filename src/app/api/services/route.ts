import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const count = await prisma.service.count();
    const service = await prisma.service.create({
      data: {
        num: String(count + 1).padStart(2, '0'),
        title: body.title || 'New Service',
        desc: body.desc || 'Service description',
        order: count + 1,
      },
    });
    return NextResponse.json(service);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
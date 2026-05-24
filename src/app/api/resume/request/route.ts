import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const requests = await prisma.resumeRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}
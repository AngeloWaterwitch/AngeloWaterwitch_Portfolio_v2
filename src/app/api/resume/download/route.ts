import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    await prisma.activityLog.create({
      data: {
        action: 'resume_download',
        detail: 'Someone downloaded the resume — ' + new Date().toLocaleString(),
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const hero = await prisma.heroContent.findFirst();
    return NextResponse.json({ success: true, hero });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: (error as any)?.message,
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { revalidatePath } from 'next/cache';

const THEME_FIELDS = [
  'primaryColor', 'primaryLight', 'primaryDim',
  'bgDark', 'bgDark2', 'bgDark3', 'bgDark4',
  'textLight', 'displayFont', 'monoFont',
];

function sanitize(body: any) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => THEME_FIELDS.includes(key))
  );
}

export async function GET() {
  try {
    const theme = await prisma.themeSettings.findFirst();
    return NextResponse.json(theme);
  } catch (e) {
    console.error('[GET /api/theme]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = sanitize(await req.json());
    const existing = await prisma.themeSettings.findFirst();
    const theme = existing
      ? await prisma.themeSettings.update({ where: { id: existing.id }, data: body })
      : await prisma.themeSettings.create({ data: body });
    revalidatePath('/');
    return NextResponse.json(theme);
  } catch (e) {
    console.error('[PUT /api/theme] ERROR:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
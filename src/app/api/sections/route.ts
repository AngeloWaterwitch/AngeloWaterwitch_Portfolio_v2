import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';

const sectionsSchema = z
  .array(
    z.object({
      sectionId: z.string().min(1).max(40),
      label: z.string().min(1).max(40).transform((s) => sanitise(s)),
      visible: z.boolean(),
      order: z.number().int().min(0).max(1000),
    }),
  )
  .min(1)
  .max(30);

export async function GET() {
  try {
    const sections = await prisma.siteSection.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json(sections);
  } catch {
    return NextResponse.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const parsed = sectionsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
    }

    // Only update sections that already exist, so this cannot invent new ones.
    const existing = await prisma.siteSection.findMany({ select: { sectionId: true } });
    const known = new Set(existing.map((s) => s.sectionId));
    const updates = parsed.data.filter((s) => known.has(s.sectionId));

    await prisma.$transaction(
      updates.map((s) =>
        prisma.siteSection.update({
          where: { sectionId: s.sectionId },
          data: { label: s.label, visible: s.visible, order: s.order },
        }),
      ),
    );

    revalidatePath('/');
    const sections = await prisma.siteSection.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json(sections);
  } catch (err) {
    console.error('[sections PUT]', (err as Error).message);
    return NextResponse.json({ error: 'Failed to save sections' }, { status: 500 });
  }
}

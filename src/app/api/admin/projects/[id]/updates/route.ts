import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { logEvent } from '@/lib/worklog';

const text = (min: number, max: number) => z.string().min(min).max(max).transform((s) => sanitise(s));

const schema = z.object({
  title: text(2, 120),
  body: text(0, 4000).optional().default(''),
  progress: z.number().int().min(0).max(100).optional(),
  visibleToClient: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const project = await prisma.clientProject.findUnique({ where: { id }, select: { id: true } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const [update] = await prisma.$transaction([
    prisma.progressUpdate.create({
      data: { projectId: id, title: d.title, body: d.body, progress: d.progress ?? null, visibleToClient: d.visibleToClient },
    }),
    ...(d.progress !== undefined
      ? [prisma.clientProject.update({ where: { id }, data: { progress: d.progress } })]
      : []),
  ]);

  await audit('ADMIN', 'admin', 'project.update.post', { projectId: id, updateId: update.id }, clientIp(req));
  await logEvent(id, 'UPDATE_POSTED', `Update posted: ${d.title}`, { visible: d.visibleToClient });
  return NextResponse.json(update, { status: 201 });
}

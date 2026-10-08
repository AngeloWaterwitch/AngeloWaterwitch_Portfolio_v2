import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';

const text = (min: number, max: number) => z.string().min(min).max(max).transform((s) => sanitise(s));
const rands = z.number().min(0).max(10_000_000);

const schema = z
  .object({
    title: text(2, 120),
    description: text(0, 2000).optional().default(''),
    totalRands: rands.default(0),
    depositRands: rands.default(0),
  })
  .refine((p) => p.depositRands <= p.totalRands, { message: 'The deposit cannot be more than the total.' });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (client.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'This contract is finished. Reactivate the client first.' }, { status: 409 });
  }

  const project = await prisma.clientProject.create({
    data: {
      clientId: id,
      title: d.title,
      description: d.description,
      totalCents: Math.round(d.totalRands * 100),
      depositCents: Math.round(d.depositRands * 100),
      status: d.depositRands > 0 ? 'DEPOSIT_PENDING' : 'QUOTED',
    },
  });
  await audit('ADMIN', 'admin', 'project.create', { clientId: id, projectId: project.id }, clientIp(req));
  return NextResponse.json(project, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { issueAccessCode, formatAccessCode, normaliseAccessCode } from '@/lib/client-auth';

const text = (min: number, max: number) => z.string().min(min).max(max).transform((s) => sanitise(s));
const rands = z.number().min(0).max(10_000_000);

const createSchema = z.object({
  name: text(2, 100),
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  phone: text(0, 40).optional().default(''),
  company: text(0, 120).optional().default(''),
  project: z
    .object({
      title: text(2, 120),
      description: text(0, 2000).optional().default(''),
      totalRands: rands.default(0),
      depositRands: rands.default(0),
    })
    .refine((p) => p.depositRands <= p.totalRands, { message: 'The deposit cannot be more than the total.' }),
});

const publicClient = {
  id: true, name: true, email: true, phone: true, company: true, status: true,
  accessCodeHint: true, codeIssuedAt: true, codeExpiresAt: true, lastLoginAt: true, createdAt: true,
} as const;

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      ...publicClient,
      projects: { select: { id: true, title: true, status: true, progress: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const { code, hash, hint } = issueAccessCode();
  try {
    const client = await prisma.client.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        company: d.company || null,
        accessCodeHash: hash,
        accessCodeHint: hint,
        projects: {
          create: {
            title: d.project.title,
            description: d.project.description,
            totalCents: Math.round(d.project.totalRands * 100),
            depositCents: Math.round(d.project.depositRands * 100),
            status: d.project.depositRands > 0 ? 'DEPOSIT_PENDING' : 'QUOTED',
          },
        },
      },
      select: { ...publicClient, projects: true },
    });

    await audit('ADMIN', 'admin', 'client.create', { clientId: client.id }, clientIp(req));
    // The only time the plain code exists. It is not stored and cannot be shown again.
    return NextResponse.json({ client, accessCode: formatAccessCode(normaliseAccessCode(code)!) }, { status: 201 });
  } catch (err) {
    console.error('[admin clients POST]', (err as Error).message);
    return NextResponse.json({ error: 'Failed to create the client' }, { status: 500 });
  }
}

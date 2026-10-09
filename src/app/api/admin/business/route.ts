import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { audit } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';
import { payfastConfigured, payfastMode } from '@/lib/payfast';

const text = (min: number, max: number) => z.string().max(max).transform((s) => sanitise(s)).refine((s) => s.length >= min, { message: `Must be at least ${min} character${min === 1 ? '' : 's'}` });

const schema = z.object({
  tradingName: text(0, 120),
  legalName: text(2, 120),
  idOrRegNumber: text(2, 60),
  address: text(5, 200),
  city: text(2, 80),
  province: text(2, 80),
  email: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
  phone: text(0, 40),
  vatRegistered: z.boolean(),
  vatNumber: text(0, 30),
  bankName: text(0, 80),
  accountHolder: text(0, 120),
  accountNumber: text(0, 30),
  branchCode: text(0, 20),
  accountType: text(0, 30),
  informationOfficerName: text(2, 120),
  informationOfficerEmail: z.string().email().max(254).transform((s) => s.trim().toLowerCase()),
}).refine((d) => !d.vatRegistered || d.vatNumber.length >= 4, { message: 'Enter your VAT number, or untick "VAT registered".', path: ['vatNumber'] });

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const profile = await prisma.businessProfile.findFirst();
  return NextResponse.json({
    profile,
    status: {
      payfastConfigured: payfastConfigured(),
      payfastMode: payfastMode(),
      emailConfigured: !!(process.env.RESEND_API_KEY ?? '').trim(),
      emailFrom: (process.env.EMAIL_FROM ?? '').trim().replace(/^["']+|["']+$/g, '') || 'Portfolio <onboarding@resend.dev> (test sender: delivers to you only)',
    },
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;
  const data = { ...d, vatNumber: d.vatRegistered ? d.vatNumber : null };

  const existing = await prisma.businessProfile.findFirst();
  const profile = existing
    ? await prisma.businessProfile.update({ where: { id: existing.id }, data })
    : await prisma.businessProfile.create({ data });
  await audit('ADMIN', 'admin', 'business.update', undefined, clientIp(req));
  return NextResponse.json({ profile });
}

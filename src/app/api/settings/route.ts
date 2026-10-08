import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { sanitise } from '@/lib/sanitise';
import { HEADING_SECTION_IDS, resolveSettings, safeUrl } from '@/lib/siteSettings';

const text = (max: number) => z.string().max(max).transform((s) => sanitise(s));
const link = z.string().max(300).transform((s) => s.trim());

const headingSchema = z.object({
  eyebrow: text(60),
  lead: text(60),
  highlight: text(60),
});

const settingsSchema = z.object({
  footerTagline: text(300),
  footerCopyright: text(100),
  footerCredit: text(120),
  showFooterCredit: z.boolean(),
  showAdminLink: z.boolean(),
  navCtaLabel: text(40).optional().default(''),
  navCtaUrl: link.optional().default(''),
  legalLinks: z
    .array(z.object({ label: text(60), url: link }))
    .max(8)
    .default([]),
  sectionHeadings: z.record(z.string(), headingSchema).default({}),
});

export async function GET() {
  try {
    const row = await prisma.siteSettings.findFirst();
    return NextResponse.json(resolveSettings(row));
  } catch {
    // Table missing or database down: serve defaults rather than failing.
    return NextResponse.json(resolveSettings(null));
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const parsed = settingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 });
    }
    const d = parsed.data;

    // Links must be safe (http/https/mailto/tel/#/relative). Reject instead of silently dropping.
    const badLink = [d.navCtaUrl, ...d.legalLinks.map((l) => l.url)].find((u) => u && !safeUrl(u));
    if (badLink !== undefined) {
      return NextResponse.json(
        { error: 'Links must start with https://, http://, mailto:, tel:, # or /' },
        { status: 400 },
      );
    }

    // Only known sections, and only non-empty headings.
    const headings: Record<string, { eyebrow: string; lead: string; highlight: string }> = {};
    for (const id of HEADING_SECTION_IDS) {
      const h = d.sectionHeadings[id];
      if (h && (h.eyebrow || h.lead || h.highlight)) headings[id] = h;
    }

    const data = {
      footerTagline: d.footerTagline,
      footerCopyright: d.footerCopyright,
      footerCredit: d.footerCredit,
      showFooterCredit: d.showFooterCredit,
      showAdminLink: d.showAdminLink,
      navCtaLabel: d.navCtaLabel || null,
      navCtaUrl: d.navCtaUrl || null,
      legalLinks: d.legalLinks.filter((l) => l.label && l.url),
      sectionHeadings: headings,
    };

    const existing = await prisma.siteSettings.findFirst();
    const row = existing
      ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
      : await prisma.siteSettings.create({ data });

    revalidatePath('/');
    return NextResponse.json(resolveSettings(row));
  } catch (err) {
    console.error('[settings PUT]', (err as Error).message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

import { prisma } from '@/lib/prisma';
import { resolveSettings } from '@/lib/siteSettings';

async function loadSiteData() {
  const [
    hero,
    about,
    skills,
    projects,
    services,
    timeline,
    testimonials,
    contact,
    seo,
    branding,
    sections,
    resume,
    theme,
    settingsRow,
  ] = await Promise.all([
    prisma.heroContent.findFirst(),
    prisma.aboutContent.findFirst(),
    prisma.skill.findMany({ orderBy: { order: 'asc' } }),
    prisma.project.findMany({
      orderBy: { order: 'asc' },
      include: { media: true },
    }),
    prisma.service.findMany({ orderBy: { order: 'asc' } }),
    prisma.timelineEvent.findMany({ orderBy: { order: 'asc' } }),
    prisma.testimonial.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactInfo.findFirst(),
    prisma.sEOSettings.findFirst(),
    prisma.branding.findFirst(),
    prisma.siteSection.findMany({ orderBy: { order: 'asc' } }),
    prisma.resumeFile.findFirst({ where: { enabled: true } }),
    prisma.themeSettings.findFirst(),
    // Tolerate the table not existing yet (deploy before migration) without taking the site down.
    prisma.siteSettings.findFirst().catch(() => null),
  ]);

  return {
    hero,
    about,
    skills,
    projects,
    services,
    timeline,
    testimonials,
    contact,
    seo,
    branding,
    sections,
    resume,
    theme,
    settings: resolveSettings(settingsRow),
  };
}

/** Minimal content shown when the database is unreachable so visitors still see a working page. */
function fallbackSiteData() {
  return {
    hero: {
      name: 'Angelo Waterwitch',
      role: 'Software & Design Engineer',
      sub: 'Web developer building fast, secure and well-designed websites.',
      resumeEnabled: false,
      resumeUrl: null,
      resumeLabel: 'Download CV',
    },
    about: null,
    skills: [],
    projects: [],
    services: [],
    timeline: [],
    testimonials: [],
    contact: {
      email: process.env.RESEND_TO_EMAIL ?? '',
      phone: null,
      location: null,
      facebook: null,
      linkedin: null,
      instagram: null,
      github: null,
    },
    seo: null,
    branding: null,
    sections: [
      { sectionId: 'home', label: 'Home', visible: true, order: 0 },
      { sectionId: 'contact', label: 'Contact', visible: true, order: 1 },
    ],
    resume: null,
    theme: null,
    settings: resolveSettings(null),
  };
}

type SiteData = Awaited<ReturnType<typeof loadSiteData>>;

export async function getSiteData(): Promise<SiteData & { degraded: boolean }> {
  try {
    return { ...(await loadSiteData()), degraded: false };
  } catch (err) {
    console.error('[getSiteData] database unavailable, serving fallback:', (err as Error).message);
    return { ...(fallbackSiteData() as unknown as SiteData), degraded: true };
  }
}

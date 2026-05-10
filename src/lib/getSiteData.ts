import { prisma } from '@/lib/prisma';

export async function getSiteData() {
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
  };
}
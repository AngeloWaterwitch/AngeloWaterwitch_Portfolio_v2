import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  try {
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
      prisma.project.findMany({ orderBy: { order: 'asc' }, include: { media: true } }),
      prisma.service.findMany({ orderBy: { order: 'asc' } }),
      prisma.timelineEvent.findMany({ orderBy: { order: 'asc' } }),
      prisma.testimonial.findMany({ where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } }),
      prisma.contactInfo.findFirst(),
      prisma.sEOSettings.findFirst(),
      prisma.branding.findFirst(),
      prisma.siteSection.findMany({ orderBy: { order: 'asc' } }),
      prisma.resumeFile.findFirst({ where: { enabled: true } }),
    ]);

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch site data' }, { status: 500 });
  }
}
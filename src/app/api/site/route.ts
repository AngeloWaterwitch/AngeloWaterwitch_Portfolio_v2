import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function decode(str: string | null | undefined): string {
  if (!str) return str as any;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function decodeObj<T extends Record<string, any>>(obj: T | null): T | null {
  if (!obj) return null;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      result[key] = decode(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map(v => typeof v === 'object' && v !== null ? decodeObj(v) : typeof v === 'string' ? decode(v) : v);
    } else if (typeof val === 'object' && val !== null) {
      result[key] = decodeObj(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

export async function GET() {
  try {
    const [
      hero, about, skills, projects, services, timeline,
      testimonials, contact, seo, branding, sections, resume, theme,
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
      prisma.themeSettings.findFirst(),
    ]);

    return NextResponse.json({
      hero: decodeObj(hero),
      about: decodeObj(about),
      skills: skills.map(decodeObj),
      projects: projects.map(decodeObj),
      services: services.map(decodeObj),
      timeline: timeline.map(decodeObj),
      testimonials: testimonials.map(decodeObj),
      contact: decodeObj(contact),
      seo: decodeObj(seo),
      branding: decodeObj(branding),
      sections: sections.map(decodeObj),
      resume: decodeObj(resume),
      theme: decodeObj(theme),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch site data' }, { status: 500 });
  }
}
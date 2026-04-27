import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Dynamic import to avoid WASM issues
async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient({ adapter } as any);
}

async function main() {
  const prisma = await getPrisma();
  
  console.log('Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.resumeFile.deleteMany();
  await prisma.siteSection.deleteMany();
  await prisma.branding.deleteMany();
  await prisma.sEOSettings.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.contactInfo.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.service.deleteMany();
  await prisma.projectMedia.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.aboutContent.deleteMany();
  await prisma.heroContent.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  await prisma.heroContent.create({
    data: {
      name: 'Angelo Waterwitch',
      role: 'Software & Design Engineer',
      sub: 'I turn complex problems into elegant, functional solutions — blending creativity with technical precision.',
      resumeEnabled: true,
      resumeUrl: '/resume/AngeloWaterwitch_CV (4).pdf',
      resumeLabel: 'Download CV',
    },
  });
  console.log('Seeded hero');

  await prisma.aboutContent.create({
    data: {
      bio1: 'My name is Angelo Waterwitch, I am a software and design engineering student deeply committed to mastering the blend of creativity and technical precision.',
      bio2: 'I thrive on turning complex problems into elegant, functional solutions, with a focus on creating impactful digital experiences.',
      years: '3+',
      projects: '15+',
      clients: '10+',
      standing: 'Distinction',
    },
  });
  console.log('Seeded about');

  await prisma.skill.createMany({
    data: [
      { icon: '⚛️', name: 'React',       order: 1 },
      { icon: '🎨', name: 'CSS / Sass',  order: 2 },
      { icon: '⚡', name: 'JavaScript',  order: 3 },
      { icon: '📐', name: 'Figma',       order: 4 },
      { icon: '🌐', name: 'HTML5',       order: 5 },
      { icon: '🗄️', name: 'MySQL',       order: 6 },
      { icon: '🐘', name: 'PHP',         order: 7 },
      { icon: '🟩', name: 'Node.js',     order: 8 },
      { icon: '🔷', name: 'WordPress',   order: 9 },
      { icon: '🔧', name: 'TypeScript',  order: 10 },
    ],
  });
  console.log('Seeded skills');

  await prisma.project.create({
    data: {
      title: 'Home Connect',
      desc: 'A real estate web platform connecting buyers and sellers with intuitive UI and smart search.',
      tags: ['React', 'Node.js', 'MySQL'],
      link: '#',
      order: 1,
    },
  });

  await prisma.project.create({
    data: {
      title: 'Mammoth Studio',
      desc: 'Brand identity and web presence for a creative production studio.',
      tags: ['Figma', 'WordPress', 'CSS'],
      link: '#',
      order: 2,
    },
  });

  await prisma.project.create({
    data: {
      title: 'Portfolio v1',
      desc: 'First iteration of personal portfolio — dark theme, animated sections.',
      tags: ['HTML', 'CSS', 'JavaScript'],
      link: '#',
      order: 3,
    },
  });

  await prisma.project.create({
    data: {
      title: 'E-commerce UI',
      desc: 'Full-featured product catalogue with cart, filters, and checkout flow.',
      tags: ['React', 'PHP', 'MySQL'],
      link: '#',
      order: 4,
    },
  });
  console.log('Seeded projects');

  await prisma.service.createMany({
    data: [
      {
        num: '01',
        title: 'Logo Design',
        desc: 'Logos that represent a brand\'s identity and leave a lasting impression.',
        order: 1,
      },
      {
        num: '02',
        title: 'Web Design',
        desc: 'Visually engaging websites that deliver an intuitive user experience.',
        order: 2,
      },
      {
        num: '03',
        title: 'Product Design',
        desc: 'From concept to final design — solving real-world problems through innovative solutions.',
        order: 3,
      },
    ],
  });
  console.log('Seeded services');

  await prisma.timelineEvent.createMany({
    data: [
      {
        type: 'education',
        title: 'Software & Design Engineering',
        organisation: 'CPUT — Cape Peninsula University of Technology',
        period: '2023 — Present',
        desc: 'Studying software and design engineering with a focus on full-stack development and UI/UX design.',
        order: 1,
      },
      {
        type: 'education',
        title: 'National Senior Certificate',
        organisation: 'High School',
        period: '2018 — 2022',
        desc: 'Completed matric with a focus on IT and design subjects.',
        order: 2,
      },
      {
        type: 'work',
        title: 'Freelance Web Developer & Designer',
        organisation: 'Self Employed',
        period: '2022 — Present',
        desc: 'Building websites and brand identities for local businesses across Cape Town.',
        order: 3,
      },
    ],
  });
  console.log('Seeded timeline');

  await prisma.testimonial.createMany({
    data: [
      {
        quote: 'Angelo delivered beyond our expectations. His attention to detail is remarkable.',
        author: 'Sarah Hendricks',
        role: 'Founder, Bloom Studio',
        status: 'APPROVED',
      },
      {
        quote: 'The website he built for us doubled our engagement rate.',
        author: 'James Mokoena',
        role: 'CEO, Apex Digital',
        status: 'APPROVED',
      },
      {
        quote: 'Professional, fast, and creative. Angelo\'s work speaks for itself.',
        author: 'Layla Peterson',
        role: 'Marketing Director, NexaCo',
        status: 'APPROVED',
      },
      {
        quote: 'He redesigned our brand from scratch — the results were stunning.',
        author: 'Thabo Dlamini',
        role: 'Product Manager, Solara',
        status: 'APPROVED',
      },
    ],
  });
  console.log('Seeded testimonials');

  await prisma.contactInfo.create({
    data: {
      email: 'angelo@waterwitch.dev',
      phone: '+27 XX XXX XXXX',
      location: 'Cape Town, South Africa',
      facebook: 'https://web.facebook.com/Angelo.waterwitch.26',
      linkedin: 'https://www.linkedin.com/in/angelo-waterwitch-514248233/',
      instagram: 'https://www.instagram.com/yeah_itsangelo/',
      github: 'https://github.com/AngeloWaterwitch',
    },
  });
  console.log('Seeded contact');

  await prisma.sEOSettings.create({
    data: {
      title: 'Angelo Waterwitch — Software & Design Engineer',
      description: 'Portfolio of Angelo Waterwitch, a software and design engineering student based in Cape Town, South Africa.',
      keywords: 'Angelo Waterwitch, web developer, software engineer, React, Cape Town',
      twitterHandle: '@yeah_itsangelo',
    },
  });
  console.log('Seeded SEO');

  await prisma.branding.create({
    data: {
      logoText: 'AW.',
      displayFont: 'Syne',
      monoFont: 'Space Mono',
    },
  });
  console.log('Seeded branding');

  await prisma.siteSection.createMany({
    data: [
      { sectionId: 'home',         label: 'Home',         visible: true, order: 1 },
      { sectionId: 'about',        label: 'About',        visible: true, order: 2 },
      { sectionId: 'skills',       label: 'Skills',       visible: true, order: 3 },
      { sectionId: 'projects',     label: 'Projects',     visible: true, order: 4 },
      { sectionId: 'services',     label: 'Services',     visible: true, order: 5 },
      { sectionId: 'timeline',     label: 'Timeline',     visible: true, order: 6 },
      { sectionId: 'testimonials', label: 'Testimonials', visible: true, order: 7 },
      { sectionId: 'contact',      label: 'Contact',      visible: true, order: 8 },
    ],
  });
  console.log('Seeded sections');

  await prisma.resumeFile.create({
    data: {
      url: '/resume/AngeloWaterwitch_CV (4).pdf',
      filename: 'AngeloWaterwitch_CV.pdf',
      enabled: true,
    },
  });
  console.log('Seeded resume');

  console.log('✓ Database seeded successfully!');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
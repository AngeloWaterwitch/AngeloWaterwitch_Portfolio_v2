import { getSiteData } from '@/lib/getSiteData';
import Navbar from '@/components/portfolio/Navbar';
import Hero from '@/components/portfolio/Hero';
import About from '@/components/portfolio/About';
import Skills from '@/components/portfolio/Skills';
import Projects from '@/components/portfolio/Projects';
import Services from '@/components/portfolio/Services';
import Timeline from '@/components/portfolio/Timeline';
import Testimonials from '@/components/portfolio/Testimonials';
import Contact from '@/components/portfolio/Contact';
import Footer from '@/components/portfolio/Footer';
import { headingFor } from '@/lib/siteSettings';
import { siteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const data = await getSiteData();
  const title = data.seo?.title || 'Angelo Waterwitch | Web Developer & Software Engineer';
  const description = data.seo?.description || 'Angelo Waterwitch is a web developer and software & design engineer in Springbok, Northern Cape, South Africa.';
  return {
    title,
    description,
    keywords: data.seo?.keywords || '',
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: 'Angelo Waterwitch',
      locale: 'en_ZA',
      url: '/',
      title,
      description,
      // With no image chosen in the admin, the generated preview picture is used.
      ...(data.seo?.ogImage ? { images: [data.seo.ogImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(data.seo?.twitterHandle ? { creator: data.seo.twitterHandle } : {}),
    },
  };
}

export default async function Home() {
  const data = await getSiteData();

  const sectionComponents: Record<string, React.ReactNode> = {
    home: <Hero hero={data.hero} resume={data.resume} />,
    about: <About about={data.about} heading={headingFor(data.settings, 'about')} />,
    skills: <Skills skills={data.skills} heading={headingFor(data.settings, 'skills')} />,
    projects: <Projects projects={data.projects} heading={headingFor(data.settings, 'projects')} />,
    services: <Services services={data.services} heading={headingFor(data.settings, 'services')} />,
    timeline: <Timeline timeline={data.timeline} heading={headingFor(data.settings, 'timeline')} />,
    testimonials: <Testimonials testimonials={data.testimonials} heading={headingFor(data.settings, 'testimonials')} />,
    contact: <Contact contact={data.contact} heading={headingFor(data.settings, 'contact')} />,
  };

  const visibleSections = data.sections?.filter(s => s.visible) || [];

  // Structured data so search engines know who this site is about (helps results for your name).
  const base = siteUrl();
  const socials = [data.contact?.linkedin, data.contact?.github, data.contact?.facebook, data.contact?.instagram].filter((u): u is string => !!u && u.startsWith('http'));
  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': base + '/#person',
    name: data.hero?.name || 'Angelo Waterwitch',
    jobTitle: data.hero?.role || 'Software & Design Engineer',
    url: base + '/',
    ...(data.about?.photoUrl ? { image: data.about.photoUrl } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Springbok', addressRegion: 'Northern Cape', addressCountry: 'ZA' },
    knowsAbout: (data.skills ?? []).map((k: { name: string }) => k.name),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      { '@type': 'WebSite', '@id': base + '/#website', url: base + '/', name: 'Angelo Waterwitch', inLanguage: 'en-ZA', publisher: { '@id': base + '/#person' } },
    ],
  };

  const fontFamily = data.branding?.displayFont || 'Syne';
  const monoFont = data.branding?.monoFont || 'Space Mono';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <style>{`
        :root {
          --cr: ${data.theme?.primaryColor || 'hsl(348, 100%, 40%)'};
          --cr-light: ${data.theme?.primaryLight || 'hsl(348, 100%, 55%)'};
          --cr-dim: ${data.theme?.primaryDim || 'hsl(348, 60%, 25%)'};
          --dark: ${data.theme?.bgDark || '#0a0a0a'};
          --dark2: ${data.theme?.bgDark2 || '#111111'};
          --dark3: ${data.theme?.bgDark3 || '#1a1a1a'};
          --dark4: ${data.theme?.bgDark4 || '#222222'};
          --light: ${data.theme?.textLight || '#f0ede8'};
          --font-display: '${data.theme?.displayFont || data.branding?.displayFont || 'Syne'}', sans-serif;
          --font-mono: '${data.theme?.monoFont || data.branding?.monoFont || 'Space Mono'}', monospace;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; scroll-padding-top: 5rem; }
        :root { --cr-muted: #9a9a9a; }
        ::selection { background: var(--cr); color: #fff; }
        :focus-visible { outline: 2px solid var(--cr-light); outline-offset: 3px; border-radius: 2px; }
        input:focus-visible, textarea:focus-visible { outline-offset: 0; }
        .skip-link { position: absolute; left: 1rem; top: -4rem; z-index: 2000; background: var(--cr); color: #fff; padding: 0.7rem 1.2rem; font-family: var(--font-mono); font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; transition: top 0.2s; }
        .skip-link:focus { top: 1rem; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
        body { background: var(--dark); color: var(--light); font-family: var(--font-display); overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }
        button { cursor: pointer; font-family: var(--font-display); }
        img { max-width: 100%; display: block; }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.1); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--dark2); }
        ::-webkit-scrollbar-thumb { background: var(--cr-dim); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--cr); }
      `}</style>

      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar sections={data.sections} branding={data.branding} settings={data.settings} />

      <main id="main">
        {visibleSections.map(section => (
          <div key={section.sectionId}>
            {sectionComponents[section.sectionId]}
          </div>
        ))}
      </main>

      <Footer sections={data.sections} contact={data.contact} branding={data.branding} settings={data.settings} />
    </>
  );
}
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const data = await getSiteData();
  return {
    title: data.seo?.title || 'Angelo Waterwitch',
    description: data.seo?.description || 'Software & Design Engineer',
    keywords: data.seo?.keywords || '',
    openGraph: {
      title: data.seo?.title || 'Angelo Waterwitch',
      description: data.seo?.description || '',
      images: data.seo?.ogImage ? [data.seo.ogImage] : [],
    },
  };
}

export default async function Home() {
  const data = await getSiteData();

  const sectionComponents: Record<string, React.ReactNode> = {
    home: <Hero hero={data.hero} resume={data.resume} />,
    about: <About about={data.about} />,
    skills: <Skills skills={data.skills} />,
    projects: <Projects projects={data.projects} />,
    services: <Services services={data.services} />,
    timeline: <Timeline timeline={data.timeline} />,
    testimonials: <Testimonials testimonials={data.testimonials} />,
    contact: <Contact contact={data.contact} />,
  };

  const visibleSections = data.sections?.filter(s => s.visible) || [];

  const fontFamily = data.branding?.displayFont || 'Syne';
  const monoFont = data.branding?.monoFont || 'Space Mono';

  return (
    <>
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
        html { scroll-behavior: smooth; }
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

      <Navbar sections={data.sections} branding={data.branding} />

      {visibleSections.map(section => (
        <div key={section.sectionId}>
          {sectionComponents[section.sectionId]}
        </div>
      ))}

      <Footer sections={data.sections} contact={data.contact} branding={data.branding} />
    </>
  );
}
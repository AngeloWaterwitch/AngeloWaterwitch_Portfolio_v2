'use client';

import { useState, useEffect } from 'react';

export default function Navbar({ sections, branding }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const visibleSections = sections?.filter((s: any) => s.visible) || [];

  const getBarTransform = (index: number) => {
    if (!menuOpen) return 'none';
    if (index === 0) return 'rotate(45deg) translate(5px, 5px)';
    if (index === 2) return 'rotate(-45deg) translate(5px, -5px)';
    return 'none';
  };

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '1rem 1.5rem' : '1.2rem 3rem',
        background: scrolled ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(220,30,60,0.15)',
        transition: 'background 0.3s ease',
      }}>
        <a href="#home" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'hsl(348,100%,55%)',
          letterSpacing: '0.08em',
          textDecoration: 'none',
        }}>
          {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Logo"
            style={{
              height: '40px',
              width: 'auto',
              maxWidth: '120px',
              objectFit: 'contain',
              objectPosition: 'left center',
            }}
          />
        ) : (
          branding?.logoText || 'AW.'
        )}
        </a>

        {!isMobile && (
          <>
            <ul style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {visibleSections.map((s: any) => (
                <li key={s.sectionId}>
                  <a
                    href={'#' + s.sectionId}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: '#aaa',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'hsl(348,100%,55%)'; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#aaa'; }}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href="/admin"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                padding: '0.4rem 1rem',
                border: '1px solid hsl(348,60%,25%)',
                borderRadius: '2px',
                color: 'hsl(348,100%,55%)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'hsl(348,100%,40%)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'hsl(348,100%,40%)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'hsl(348,100%,55%)';
                e.currentTarget.style.borderColor = 'hsl(348,60%,25%)';
              }}
            >
              Admin
            </a>
          </>
        )}

        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', zIndex: 1001 }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: '24px', height: '2px', background: '#fff',
                borderRadius: '2px', transition: 'all 0.3s',
                transform: getBarTransform(i),
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 899,
          background: 'rgba(10,10,10,0.98)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '2rem',
        }}>
          {visibleSections.map((s: any) => (
            <a
              key={s.sectionId}
              href={'#' + s.sectionId}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 800,
                color: '#f0ede8', textDecoration: 'none',
              }}
            >
              {s.label}
            </a>
          ))}
          <a
            href="/admin"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '0.4rem 1rem',
              border: '1px solid hsl(348,60%,25%)',
              borderRadius: '2px',
              color: 'hsl(348,100%,55%)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = 'hsl(348,100%,40%)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'hsl(348,100%,55%)';
            }}
          >
            Admin
          </a>
        </div>
      )}
    </>
  );
}
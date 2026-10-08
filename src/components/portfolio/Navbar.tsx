'use client';

import { useState, useEffect } from 'react';
import { safeUrl } from '@/lib/siteSettings';

const outlineLink: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  padding: '0.4rem 1rem',
  border: '1px solid var(--cr-dim)',
  borderRadius: '2px',
  color: 'var(--cr-light)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition: 'all 0.2s',
  textDecoration: 'none',
};

const solidLink: React.CSSProperties = {
  ...outlineLink,
  background: 'var(--cr-primary)',
  borderColor: 'var(--cr-primary)',
  color: '#fff',
};

export default function Navbar({ sections, branding, settings }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close the mobile menu with Escape, and stop the page scrolling behind it while open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);

  const visibleSections = sections?.filter((s: any) => s.visible) || [];
  const showAdmin = settings?.showAdminLink === true;
  const ctaUrl = safeUrl(settings?.navCtaUrl);
  const ctaLabel: string = settings?.navCtaLabel || '';
  const showCta = !!(ctaLabel && ctaUrl);

  const getBarTransform = (index: number) => {
    if (!menuOpen) return 'none';
    if (index === 0) return 'rotate(45deg) translate(5px, 5px)';
    if (index === 2) return 'rotate(-45deg) translate(5px, -5px)';
    return 'none';
  };

  const hoverOn = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = 'var(--cr-primary)';
    e.currentTarget.style.color = '#fff';
    e.currentTarget.style.borderColor = 'var(--cr-primary)';
  };
  const hoverOff = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = 'var(--cr-light)';
    e.currentTarget.style.borderColor = 'var(--cr-dim)';
  };

  return (
    <>
      <nav aria-label="Main" style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '1rem 1.5rem' : '1.2rem 3rem',
        background: scrolled ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid color-mix(in srgb, var(--cr-primary) 15%, transparent)',
        transition: 'background 0.3s ease',
      }}>
        <a href="#home" aria-label="Home" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--cr-light)',
          letterSpacing: '0.08em',
          textDecoration: 'none',
        }}>
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt={branding?.logoText || 'Logo'} style={{ height: '40px', width: 'auto', maxWidth: '120px', objectFit: 'contain', objectPosition: 'left center' }} />
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
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--cr-light)'; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#aaa'; }}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {showCta && <a href={ctaUrl} style={solidLink}>{ctaLabel}</a>}
              {showAdmin && (
                <a href="/admin/login" style={outlineLink} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  Admin
                </a>
              )}
            </div>
          </>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'transparent', border: 'none', padding: '10px', margin: '-6px', cursor: 'pointer', zIndex: 1001 }}
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
        <div id="mobile-menu" style={{
          position: 'fixed', inset: 0, zIndex: 899,
          background: 'rgba(10,10,10,0.98)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '2rem',
          overflowY: 'auto', padding: '5rem 1.5rem 2rem',
        }}>
          {visibleSections.map((s: any) => (
            <a
              key={s.sectionId}
              href={'#' + s.sectionId}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 800,
                color: 'var(--cr-text)', textDecoration: 'none',
              }}
            >
              {s.label}
            </a>
          ))}
          {showCta && (
            <a href={ctaUrl} onClick={() => setMenuOpen(false)} style={{ ...solidLink, fontSize: '0.85rem', padding: '0.7rem 1.6rem' }}>
              {ctaLabel}
            </a>
          )}
          {showAdmin && (
            <a href="/admin/login" style={outlineLink} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
              Admin
            </a>
          )}
        </div>
      )}
    </>
  );
}

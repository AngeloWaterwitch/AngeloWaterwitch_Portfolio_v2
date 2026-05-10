'use client';

import { useState } from 'react';

export default function Footer({ sections, contact, branding }: any) {
  const visibleSections = sections?.filter((s: any) => s.visible) || [];
  const socials = [
    { label: 'Facebook', url: contact?.facebook },
    { label: 'LinkedIn', url: contact?.linkedin },
    { label: 'Instagram', url: contact?.instagram },
    { label: 'GitHub', url: contact?.github },
  ];

  return (
    <footer style={{ background: '#111', borderTop: '1px solid #1a1a1a', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 5vw, 3rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 'clamp(2rem, 4vw, 3rem)', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'hsl(348,100%,55%)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" style={{ height: '40px', width: 'auto' }} />
              ) : branding?.logoText || 'AW.'}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', color: '#555', letterSpacing: '0.08em', maxWidth: '220px', lineHeight: 1.6 }}>
              Software & Design Engineer based in Cape Town, South Africa.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Navigation</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {visibleSections.map((s: any) => (
                <li key={s.sectionId}>
                  <a href={'#' + s.sectionId} style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'hsl(348,100%,55%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#666'; }}
                  >{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Socials</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {socials.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'hsl(348,100%,55%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#666'; }}
                  >{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Contact</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#666', lineHeight: 1.7, wordBreak: 'break-all' }}>
              {contact?.email}<br />{contact?.location}
            </p>
          </div>
        </div>
        <div style={{ width: '100%', height: '1px', background: '#1a1a1a', marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.62rem, 1.5vw, 0.7rem)', color: '#444', letterSpacing: '0.08em' }}>
            © {new Date().getFullYear()} Angelo Waterwitch. All Rights Reserved.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.62rem, 1.5vw, 0.7rem)', color: '#444', letterSpacing: '0.08em' }}>
            Designed & Built by <span style={{ color: 'hsl(348,100%,55%)' }}>Angelo Waterwitch</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
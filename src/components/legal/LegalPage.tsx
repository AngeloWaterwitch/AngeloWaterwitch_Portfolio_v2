import type { ReactNode } from 'react';

const mono = "'Space Mono', monospace";

/** Shared look for the Privacy Policy and Terms pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(2rem, 6vw, 4rem) clamp(1.2rem, 5vw, 2rem) 5rem', color: 'var(--cr-text, #f0ede8)', lineHeight: 1.75, fontFamily: "'Syne', sans-serif" }}>
      <a href="/" style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--cr-muted, #9a9a9a)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', minHeight: '2.5rem', alignItems: 'center' }}>
        ← Back to the site
      </a>
      <h1 style={{ fontFamily: "'Syne', sans-serif",fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 800, lineHeight: 1.1, margin: '1rem 0 0.4rem' }}>{title}</h1>
      <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--cr-muted, #9a9a9a)', marginBottom: '2.2rem' }}>Last updated {updated}</p>
      <div style={{ fontSize: '0.98rem', color: '#cfcfcf' }}>{children}</div>
      <nav aria-label="Legal pages" style={{ marginTop: '3rem', paddingTop: '1.2rem', borderTop: '1px solid #232323', display: 'flex', gap: '1.4rem', flexWrap: 'wrap', fontFamily: mono, fontSize: '0.78rem' }}>
        <a href="/privacy" style={{ color: 'var(--cr-light, #ff1a47)', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/terms" style={{ color: 'var(--cr-light, #ff1a47)', textDecoration: 'none' }}>Terms of Use</a>
        <a href="/" style={{ color: 'var(--cr-muted, #9a9a9a)', textDecoration: 'none' }}>Home</a>
      </nav>
    </main>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ fontFamily: "'Syne', sans-serif",fontSize: '1.25rem', fontWeight: 800, color: 'var(--cr-text, #f0ede8)', margin: '2.2rem 0 0.6rem' }}>{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ margin: '0 0 0.9rem' }}>{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul style={{ margin: '0 0 0.9rem', paddingLeft: '1.3rem', display: 'grid', gap: '0.35rem' }}>{children}</ul>;
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith('http');
  return <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})} style={{ color: 'var(--cr-light, #ff1a47)' }}>{children}</a>;
}

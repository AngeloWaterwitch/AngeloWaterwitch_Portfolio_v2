'use client';

import { safeUrl, DEFAULT_SETTINGS } from '@/lib/siteSettings';

const colHeading: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cr-muted)',
  letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem',
};
const list: React.CSSProperties = {
  listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem',
};
const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--cr-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s',
};
const smallText: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.62rem, 1.5vw, 0.7rem)', color: 'var(--cr-muted)', letterSpacing: '0.08em',
};

const hoverOn = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--cr-light)'; };
const hoverOff = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--cr-muted)'; };

export default function Footer({ sections, contact, branding, settings }: any) {
  const s = settings ?? DEFAULT_SETTINGS;
  const visibleSections = sections?.filter((x: any) => x.visible) || [];

  // Only show socials that actually have a (safe) link.
  const socials = [
    { label: 'Facebook', url: safeUrl(contact?.facebook) },
    { label: 'LinkedIn', url: safeUrl(contact?.linkedin) },
    { label: 'Instagram', url: safeUrl(contact?.instagram) },
    { label: 'GitHub', url: safeUrl(contact?.github) },
  ].filter((x) => x.url);

  const legalLinks: { label: string; url: string }[] = s.legalLinks || [];

  return (
    <footer style={{ background: 'var(--cr-bg2)', borderTop: '1px solid var(--cr-bg3)', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 5vw, 3rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 'clamp(2rem, 4vw, 3rem)', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cr-light)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt={branding?.logoText || 'Logo'} style={{ height: '40px', width: 'auto' }} />
              ) : branding?.logoText || 'AW.'}
            </div>
            {s.footerTagline && (
              <p style={{ ...smallText, fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', maxWidth: '220px', lineHeight: 1.6 }}>
                {s.footerTagline}
              </p>
            )}
          </div>

          <nav aria-label="Footer">
            <div style={colHeading}>Navigation</div>
            <ul style={list}>
              {visibleSections.map((x: any) => (
                <li key={x.sectionId}>
                  <a href={'#' + x.sectionId} style={linkStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{x.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {socials.length > 0 && (
            <div>
              <div style={colHeading}>Socials</div>
              <ul style={list}>
                {socials.map((x) => (
                  <li key={x.label}>
                    <a href={x.url} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{x.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div style={colHeading}>Contact</div>
            <p style={{ ...linkStyle, textTransform: 'none', lineHeight: 1.7, wordBreak: 'break-word' }}>
              {contact?.email && (<><a href={'mailto:' + contact.email} style={{ color: 'inherit', textDecoration: 'none' }}>{contact.email}</a><br /></>)}
              {contact?.phone && (<>{contact.phone}<br /></>)}
              {contact?.location}
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--cr-bg3)', marginBottom: '1.5rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={smallText}>
            © {new Date().getFullYear()} {s.footerCopyright}. All Rights Reserved.
          </p>

          {legalLinks.length > 0 && (
            <nav aria-label="Legal">
              <ul style={{ ...list, flexDirection: 'row', flexWrap: 'wrap', gap: '1.2rem' }}>
                {legalLinks.map((l) => (
                  <li key={l.label + l.url}>
                    <a href={l.url} style={{ ...smallText, textDecoration: 'none', textTransform: 'uppercase' }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <a href="/client/login" style={{ ...smallText, textDecoration: 'none', textTransform: 'uppercase' }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>Client Portal</a>

          {s.showFooterCredit && s.footerCredit && <p style={smallText}>{s.footerCredit}</p>}
        </div>
      </div>
    </footer>
  );
}

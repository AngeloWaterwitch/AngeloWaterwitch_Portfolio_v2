import type { Metadata } from 'next';
import { getThemeAndBranding, fontsUrl } from '@/lib/theme-data';
import { siteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'Angelo Waterwitch',
  description: 'Software & Design Engineer',
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION.trim().replace(/^["']+|["']+$/g, '') } } : {}),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let theme: Awaited<ReturnType<typeof getThemeAndBranding>>['theme'] = null;
  let branding: Awaited<ReturnType<typeof getThemeAndBranding>>['branding'] = null;
  try {
    ({ theme, branding } = await getThemeAndBranding());
  } catch (err) {
    console.error('[layout] database unavailable, using default theme:', (err as Error).message);
  }

  const cssVars = `
    :root {
      --cr-primary:   ${theme?.primaryColor  ?? 'hsl(348, 100%, 40%)'};
      --cr-light:     ${theme?.primaryLight  ?? 'hsl(348, 100%, 55%)'};
      --cr-dim:       ${theme?.primaryDim    ?? 'hsl(348, 60%, 25%)'};
      --cr-bg:        ${theme?.bgDark        ?? '#0a0a0a'};
      --cr-bg2:       ${theme?.bgDark2       ?? '#111111'};
      --cr-bg3:       ${theme?.bgDark3       ?? '#1a1a1a'};
      --cr-bg4:       ${theme?.bgDark4       ?? '#222222'};
      --cr-text:      ${theme?.textLight     ?? '#f0ede8'};
      --cr-muted:     #9a9a9a;
    }
  `;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href={fontsUrl([theme?.displayFont, theme?.monoFont, branding?.displayFont, branding?.monoFont])}
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {branding?.faviconUrl && (
          <link rel="icon" href={branding.faviconUrl} />
        )}
      </head>
      <body style={{ margin: 0, padding: 0, background: 'var(--cr-bg)' }}>
        {children}
      </body>
    </html>
  );
}
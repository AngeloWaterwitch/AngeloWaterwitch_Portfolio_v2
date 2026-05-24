import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Angelo Waterwitch',
  description: 'Software & Design Engineer',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, branding] = await Promise.all([
    prisma.themeSettings.findFirst(),
    prisma.branding.findFirst(),
  ]);

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
    }
  `;

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;600;700;800&family=Raleway:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Fira+Code:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
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
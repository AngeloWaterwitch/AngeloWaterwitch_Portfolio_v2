import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Angelo Waterwitch',
  description: 'Software & Design Engineer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;600;700;800&family=Raleway:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Fira+Code:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Portal — Angelo Waterwitch',
  robots: { index: false, follow: false },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cr-bg, #0a0a0a)', color: 'var(--cr-text, #f0ede8)', fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        :root { --cr-muted: #9a9a9a; }
        *, *::before, *::after { box-sizing: border-box; }
        :focus-visible { outline: 2px solid var(--cr-light, #ff1a47); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }
      `}</style>
      {children}
    </div>
  );
}

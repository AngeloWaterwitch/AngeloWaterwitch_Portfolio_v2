import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Angelo Waterwitch',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
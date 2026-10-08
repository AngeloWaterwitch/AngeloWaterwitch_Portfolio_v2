import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0a', color: '#f0ede8', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.8rem' }}>Page not found</h1>
        <Link href="/" style={{ color: 'hsl(348,100%,55%)' }}>Back to the homepage</Link>
      </div>
    </main>
  );
}

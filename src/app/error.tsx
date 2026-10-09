'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0a', color: '#f0ede8', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.8rem' }}>Something went wrong</h1>
        <p style={{ color: '#999', marginBottom: '1.5rem' }}>The page hit a temporary problem. Reloading the page usually fixes it.</p>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* A full reload fetches the newest version of the site; "Try again" only re-runs what is already loaded. */}
          <button onClick={() => window.location.reload()} style={{ padding: '0.7rem 1.4rem', background: 'hsl(348,100%,40%)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Reload page
          </button>
          <button onClick={reset} style={{ padding: '0.7rem 1.4rem', background: 'transparent', color: '#ddd', border: '1px solid #444', cursor: 'pointer', fontWeight: 700 }}>
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}

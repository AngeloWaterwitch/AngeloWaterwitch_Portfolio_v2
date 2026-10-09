'use client';

import { useEffect, useState } from 'react';

const BUILT_WITH = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';
const CHECK_MS = 60_000;

/**
 * Pages like the client dashboard and the admin stay open for hours. A browser tab does not update itself when a new
 * version is deployed, so it keeps running old code. This notices the difference and offers a reload (it never
 * reloads by itself, so it cannot interrupt a call or a half-typed message).
 */
export default function NewVersionBanner() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let stop = false;
    const check = async () => {
      if (stop || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { id } = await res.json();
        if (id && id !== BUILT_WITH) setStale(true);
      } catch { /* offline: try again later */ }
    };
    const t = setInterval(check, CHECK_MS);
    document.addEventListener('visibilitychange', check);
    check();
    return () => { stop = true; clearInterval(t); document.removeEventListener('visibilitychange', check); };
  }, []);

  if (!stale) return null;
  return (
    <div role="status" style={{ position: 'fixed', left: '1rem', right: '1rem', bottom: '1rem', marginInline: 'auto', maxWidth: '460px', zIndex: 2600, boxSizing: 'border-box', background: '#17171c', border: '1px solid #e0a030', color: '#f0ede8', padding: '0.8rem 1rem', display: 'flex', gap: '0.8rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', fontFamily: "'Syne', sans-serif", fontSize: '0.88rem', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
      <span>A new version of this page is available.</span>
      <button type="button" onClick={() => window.location.reload()} style={{ background: 'hsl(348,100%,40%)', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px' }}>
        Reload
      </button>
    </div>
  );
}

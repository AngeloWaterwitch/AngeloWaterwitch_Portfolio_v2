'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await fetch('/api/client/logout', { method: 'POST' }).catch(() => {});
    router.push('/client/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      style={{ background: 'transparent', border: '1px solid #333', color: '#bbb', padding: '0.5rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', borderRadius: '1px' }}
    >
      {busy ? 'Signing out...' : 'Sign out'}
    </button>
  );
}

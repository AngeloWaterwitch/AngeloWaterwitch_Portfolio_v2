'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRecaptchaToken } from '@/lib/recaptcha-client';

export default function ClientLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    let recaptchaToken = '';
    try {
      recaptchaToken = await getRecaptchaToken('client_login');
    } catch {
      setError('Could not reach the security check. Check your internet connection, turn off any ad-blocker or VPN for this site, and try again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, recaptchaToken }),
      });
      if (res.ok) {
        router.push('/client');
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Could not connect. Please check your internet connection and try again.');
    }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--cr-bg3, #1a1a1a)', border: '1px solid var(--cr-bg4, #222)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '2px' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: 'var(--cr-light, #ff1a47)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
          Client Portal
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.6rem' }}>
          Welcome <span style={{ color: 'var(--cr-light, #ff1a47)' }}>back</span>
        </h1>
        <p style={{ color: 'var(--cr-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
          Enter the access code Angelo sent you to see your project&apos;s progress.
        </p>

        <form onSubmit={submit} noValidate>
          <label htmlFor="access-code" style={{ display: 'block', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Access code
          </label>
          <input
            id="access-code"
            name="access-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AW-XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={40}
            aria-invalid={!!error}
            aria-describedby={error ? 'code-error' : undefined}
            style={{ width: '100%', background: 'var(--cr-bg, #0a0a0a)', border: '1px solid #2a2a2a', color: 'var(--cr-text, #f0ede8)', padding: '0.9rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.95rem', letterSpacing: '0.08em', borderRadius: '1px', outline: 'none' }}
          />

          {error && (
            <div id="code-error" role="alert" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.74rem', color: 'var(--cr-light, #ff1a47)', marginTop: '0.9rem', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 8}
            style={{ width: '100%', marginTop: '1.4rem', padding: '1rem', background: loading || code.trim().length < 8 ? '#2a2a2a' : 'var(--cr-primary, #cc0033)', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '1px', cursor: loading || code.trim().length < 8 ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Checking...' : 'View my project'}
          </button>
        </form>

        <p style={{ color: 'var(--cr-muted)', fontSize: '0.74rem', lineHeight: 1.6, marginTop: '1.6rem', fontFamily: "'Space Mono', monospace" }}>
          Your code works until your project is finished. If you lost it, contact Angelo and a new one will be issued.
        </p>
      </div>
    </main>
  );
}

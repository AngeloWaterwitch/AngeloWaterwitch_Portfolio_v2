'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Syne', sans-serif",
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #222',
        borderRadius: '2px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '380px',
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.75rem',
          color: 'hsl(348,100%,55%)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          marginBottom: '0.8rem',
        }}>
          Admin Access
        </div>

        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#f0ede8',
          marginBottom: '2rem',
        }}>
          Sign <span style={{ color: 'hsl(348,100%,55%)' }}>In</span>
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{
              display: 'block',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              color: '#666',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                background: '#0a0a0a',
                border: '1px solid #222',
                color: '#f0ede8',
                padding: '0.8rem 1rem',
                fontFamily: "'Syne', sans-serif",
                fontSize: '0.9rem',
                borderRadius: '1px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.7rem',
              color: '#666',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#0a0a0a',
                border: '1px solid #222',
                color: '#f0ede8',
                padding: '0.8rem 1rem',
                fontFamily: "'Syne', sans-serif",
                fontSize: '0.9rem',
                borderRadius: '1px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.72rem',
              color: 'hsl(348,100%,55%)',
              marginBottom: '1rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#222' : 'hsl(348,100%,40%)',
              color: '#fff',
              border: 'none',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              borderRadius: '1px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
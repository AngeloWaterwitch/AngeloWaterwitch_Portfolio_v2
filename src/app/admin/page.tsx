import { auth } from '@/lib/auth';
import { signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f0ede8',
      fontFamily: "'Syne', sans-serif",
      padding: '2rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        borderBottom: '1px solid #222',
        paddingBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Admin <span style={{ color: 'hsl(348,100%,55%)' }}>Dashboard</span>
          </h1>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.72rem',
            color: '#666',
            marginTop: '0.3rem',
          }}>
            Logged in as {session.user?.email}
          </p>
        </div>

        <form action={async () => {
          'use server';
          await signOut({ redirectTo: '/admin/login' });
        }}>
          <button type="submit" style={{
            padding: '0.5rem 1.2rem',
            background: 'transparent',
            border: '1px solid #444',
            color: '#aaa',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '1px',
            cursor: 'pointer',
          }}>
            Sign Out
          </button>
        </form>
      </div>

      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.8rem',
        color: '#4caf50',
        letterSpacing: '0.08em',
      }}>
        ✓ Authentication working — Phase 4 complete!
      </div>
    </div>
  );
}
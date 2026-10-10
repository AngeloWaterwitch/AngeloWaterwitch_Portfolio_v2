export const metadata = { title: 'Profile deleted', robots: { index: false, follow: false } };

export default async function DeletedPage({ searchParams }: { searchParams: Promise<{ until?: string }> }) {
  const { until } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(until ?? '') ? until : null;
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--cr-bg3, #1a1a1a)', border: '1px solid var(--cr-bg4, #222)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '2px' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#6fcf73', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Done</div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '0.8rem' }}>Your profile has been deleted</h1>
        <p style={{ color: '#bbb', lineHeight: 1.7, marginBottom: '0.8rem' }}>
          Your name, contact details, messages, call records, work logs and project updates have been erased, and your access has been closed.
        </p>
        <p style={{ color: '#bbb', lineHeight: 1.7 }}>
          Your signed agreement, quote, receipts and payment records are kept because the law requires financial records to be kept for 5 years{date ? ` (until ${date})` : ''}. They are locked away, used for nothing else, and deleted when that time ends.
        </p>
        <p style={{ color: 'var(--cr-muted)', fontSize: '0.85rem', lineHeight: 1.7, marginTop: '1.2rem' }}>You can close this page.</p>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DocContent } from '@/lib/legal/types';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const label: React.CSSProperties = { ...mono, fontSize: '0.68rem', color: 'var(--cr-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' };
const dl: React.CSSProperties = { ...mono, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ddd', border: '1px solid #3a3a3a', padding: '0.4rem 0.8rem', textDecoration: 'none', borderRadius: '1px', whiteSpace: 'nowrap' };

export type ClientDoc = {
  id: string; type: string; title: string; version: number; requiresAcceptance: boolean;
  acceptedAt: string | null; createdAt: string;
  /** Only sent for documents still waiting to be accepted. */
  content?: DocContent;
};

function DocBody({ content }: { content: DocContent }) {
  return (
    // A plain, legible font on purpose: legal text and amounts must never be ambiguous (the display font draws some digits like letters).
    <div style={{ fontFamily: "Inter, system-ui, 'Segoe UI', Arial, sans-serif", fontSize: '0.88rem', lineHeight: 1.7, color: '#cfcfcf' }}>
      {content.meta && (
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.2rem 1rem', margin: '0 0 1rem' }}>
          {content.meta.map(([k, v]) => (<div key={k} style={{ display: 'contents' }}><dt style={{ color: 'var(--cr-muted)' }}>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      )}
      {content.sections.map((s, i) => (
        <section key={i} style={{ marginTop: '1.1rem' }}>
          {s.heading && <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cr-light, #ff1a47)', marginBottom: '0.4rem' }}>{s.heading}</h4>}
          {s.blocks.map((b, j) => {
            if (b.kind === 'p') return <p key={j} style={{ margin: '0.4rem 0' }}>{b.text}</p>;
            if (b.kind === 'list') return <ul key={j} style={{ margin: '0.4rem 0', paddingLeft: '1.2rem' }}>{b.items.map((t, k) => <li key={k} style={{ margin: '0.25rem 0' }}>{t}</li>)}</ul>;
            if (b.kind === 'numbered') return <ol key={j} style={{ margin: '0.4rem 0', paddingLeft: '1.2rem' }}>{b.items.map((t, k) => <li key={k}>{t}</li>)}</ol>;
            return (
              <dl key={j} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, max-content) 1fr', gap: '0.25rem 1rem', margin: '0.5rem 0' }}>
                {b.rows.map(([k, v]) => (<div key={k} style={{ display: 'contents' }}><dt style={{ color: 'var(--cr-muted)' }}>{k}</dt><dd style={{ fontWeight: 700, color: '#eee' }}>{v}</dd></div>))}
              </dl>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export default function DocumentsPanel({ docs, clientName }: { docs: ClientDoc[]; clientName: string }) {
  const router = useRouter();
  const waiting = docs.filter((d) => d.requiresAcceptance && !d.acceptedAt);
  const [name, setName] = useState('');
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const [a3, setA3] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/client/documents/accept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, agreeContract: a1, agreeNoRefund: a2, agreePrivacy: a3 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error || 'Something went wrong. Please try again.');
      else router.refresh();
    } catch { setError('No connection. Please try again.'); }
    setBusy(false);
  };

  if (docs.length === 0) return null;
  const ready = a1 && a2 && a3 && name.trim().length >= 2 && !busy;
  const box: React.CSSProperties = { display: 'flex', gap: '0.7rem', alignItems: 'flex-start', fontSize: '0.88rem', lineHeight: 1.6, cursor: 'pointer', margin: '0.7rem 0' };

  return (
    <section aria-labelledby="docs-h" style={{ background: 'var(--cr-bg3, #1a1a1a)', border: '1px solid ' + (waiting.length ? '#e0a030' : 'var(--cr-bg4, #222)'), borderRadius: '2px', padding: 'clamp(1.1rem, 4vw, 1.8rem)', marginBottom: '1.5rem' }}>
      <h2 id="docs-h" style={{ ...label, color: waiting.length ? '#e0a030' : 'var(--cr-muted)', marginBottom: '0.9rem' }}>
        {waiting.length ? 'Step 1: read and accept your agreement' : 'Your documents'}
      </h2>

      {waiting.length > 0 && (
        <>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: '#ddd', marginBottom: '1rem' }}>
            Please read the documents below. Once you accept them you can pay your deposit and work can begin.
          </p>
          {waiting.map((d) => (
            <details key={d.id} style={{ border: '1px solid #2a2a2a', borderRadius: '2px', padding: '0.7rem 1rem', marginBottom: '0.6rem', background: '#141414' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{d.title}</summary>
              <div style={{ margin: '0.8rem 0', display: 'flex', gap: '0.6rem' }}>
                <a href={`/api/client/documents/${d.id}/pdf`} style={dl}>Download PDF</a>
              </div>
              {d.content && <DocBody content={d.content} />}
            </details>
          ))}

          <div style={{ marginTop: '1.3rem', paddingTop: '1.2rem', borderTop: '1px solid #2a2a2a' }}>
            <label style={box}><input type="checkbox" checked={a1} onChange={(e) => setA1(e.target.checked)} style={{ marginTop: '0.25rem' }} />
              <span>I have read and I agree to the agreement{waiting.some((d) => d.type === 'NDA') ? ' and the non-disclosure agreement' : ''}.</span></label>
            <label style={box}><input type="checkbox" checked={a2} onChange={(e) => setA2(e.target.checked)} style={{ marginTop: '0.25rem' }} />
              <span><strong>I understand that the deposit is non-refundable once it is paid</strong>, and that I can cancel at any time as described in the Cancellation &amp; Refund Policy.</span></label>
            <label style={box}><input type="checkbox" checked={a3} onChange={(e) => setA3(e.target.checked)} style={{ marginTop: '0.25rem' }} />
              <span>I have read the Privacy Notice and I agree to my personal information being processed as described.</span></label>

            <label htmlFor="sign-name" style={{ ...label, display: 'block', margin: '1.1rem 0 0.4rem' }}>Type your full name to sign: {clientName}</label>
            <input id="sign-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} placeholder={clientName}
              style={{ width: '100%', maxWidth: '420px', background: '#0a0a0a', border: '1px solid #2a2a2a', color: 'var(--cr-text, #f0ede8)', padding: '0.8rem 1rem', fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', borderRadius: '1px' }} />
            <p style={{ ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', lineHeight: 1.6, marginTop: '0.6rem' }}>
              Your acceptance is recorded with the date, time and your device&apos;s IP address, and has the same effect as a signature.
            </p>
            {error && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'var(--cr-light, #ff1a47)', marginTop: '0.7rem' }}>{error}</div>}
            <button type="button" disabled={!ready} onClick={accept}
              style={{ marginTop: '1rem', padding: '0.9rem 1.6rem', background: ready ? 'var(--cr-primary, #cc0033)' : '#2a2a2a', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '1px', cursor: ready ? 'pointer' : 'not-allowed' }}>
              {busy ? 'Saving...' : 'Accept and sign'}
            </button>
          </div>
        </>
      )}

      <ul style={{ listStyle: 'none', margin: waiting.length ? '1.6rem 0 0' : 0, padding: 0 }}>
        {docs.map((d) => (
          <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', padding: '0.6rem 0', borderTop: '1px solid #232323' }}>
            <div>
              <span style={{ fontWeight: 700 }}>{d.title}</span>
              {d.requiresAcceptance && (d.acceptedAt
                ? <span style={{ ...mono, fontSize: '0.66rem', color: '#4caf50', marginLeft: '0.6rem' }}>✓ accepted {new Date(d.acceptedAt).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</span>
                : <span style={{ ...mono, fontSize: '0.66rem', color: '#e0a030', marginLeft: '0.6rem' }}>waiting for you</span>)}
            </div>
            <a href={`/api/client/documents/${d.id}/pdf`} style={dl}>Download PDF</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRands } from '@/lib/format';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const label: React.CSSProperties = { ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', margin: '1rem 0 0.4rem' };

type Props = {
  projectId: string;
  title: string;
  status: string;
  currency: string;
  depositCents: number;
  depositPaidAt: string | null;
  finalPaidAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
};

export default function CancelPanel(p: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const depositPaid = !!p.depositPaidAt;
  const money = formatRands(p.depositCents, p.currency);

  if (p.status === 'CANCELLED') {
    return (
      <div role="status" style={{ marginTop: '1.4rem', padding: '0.9rem 1.1rem', border: '1px solid #444', borderRadius: '2px', background: 'rgba(255,255,255,0.02)', color: '#bbb', fontSize: '0.88rem', lineHeight: 1.6 }}>
        This project was cancelled{p.cancelledAt ? ` on ${new Date(p.cancelledAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' })}` : ''}{p.cancelledBy === 'CLIENT' ? ' at your request' : ''}.
        {' '}{depositPaid ? `The deposit of ${money} is non-refundable.` : 'Nothing is owed.'} Your Cancellation Notice is under Your documents.
      </div>
    );
  }
  if (p.status === 'COMPLETED' || p.finalPaidAt) return null;

  const ready = confirm.trim().toUpperCase() === 'CANCEL' && (!depositPaid || ack) && !busy;

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/client/projects/${p.projectId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'CANCEL', acknowledgeNoRefund: ack, reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || 'Something went wrong. Please try again.'); setBusy(false); return; }
      router.refresh();
    } catch { setError('No connection. Please try again.'); setBusy(false); }
  };

  return (
    <div style={{ marginTop: '1.6rem', paddingTop: '1.2rem', borderTop: '1px solid #232323' }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: '#aaa', border: '1px solid #3a3a3a', padding: '0.55rem 1rem', cursor: 'pointer', borderRadius: '1px' }}>
          Cancel this project
        </button>
      ) : (
        <div role="group" aria-label="Cancel this project" style={{ border: '1px solid ' + (depositPaid ? '#b3243d' : '#3a5a3a'), background: depositPaid ? 'rgba(179,36,61,0.07)' : 'rgba(76,175,80,0.05)', padding: '1.1rem 1.2rem', borderRadius: '2px' }}>
          <div style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: depositPaid ? '#ff7a95' : '#6fcf73', marginBottom: '0.6rem' }}>
            Cancel &quot;{p.title}&quot;
          </div>
          {depositPaid ? (
            <p style={{ fontSize: '0.92rem', lineHeight: 1.7 }}>
              <strong>The deposit of {money} you already paid will NOT be refunded.</strong> It reserved time and paid for the start of work made specially for you.
              Work stops immediately and unfinished work stays with Angelo. No further amount is owed.
            </p>
          ) : (
            <p style={{ fontSize: '0.92rem', lineHeight: 1.7 }}>
              You have not paid the deposit yet, so <strong>cancelling costs you nothing</strong> and nothing is owed.
            </p>
          )}

          <label htmlFor={'cancel-reason-' + p.projectId} style={label}>Reason (optional)</label>
          <textarea id={'cancel-reason-' + p.projectId} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2}
            style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', color: 'var(--cr-text, #f0ede8)', padding: '0.6rem 0.8rem', fontFamily: "'Syne', sans-serif", fontSize: '0.88rem', borderRadius: '1px', resize: 'vertical' }} />

          {depositPaid && (
            <label style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', fontSize: '0.88rem', lineHeight: 1.6, margin: '1rem 0 0.2rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ marginTop: '0.25rem' }} />
              <span>I understand that the deposit will not be refunded.</span>
            </label>
          )}

          <label htmlFor={'cancel-confirm-' + p.projectId} style={label}>Type CANCEL to confirm</label>
          <input id={'cancel-confirm-' + p.projectId} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" maxLength={10}
            style={{ width: '100%', maxWidth: '240px', background: '#0a0a0a', border: '1px solid #2a2a2a', color: 'var(--cr-text, #f0ede8)', padding: '0.7rem 0.9rem', ...mono, fontSize: '0.9rem', letterSpacing: '0.1em', borderRadius: '1px' }} />

          {error && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'var(--cr-light, #ff1a47)', marginTop: '0.8rem', lineHeight: 1.5 }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
            <button type="button" disabled={!ready} onClick={submit}
              style={{ padding: '0.75rem 1.3rem', background: ready ? '#b3243d' : '#2a2a2a', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: ready ? 'pointer' : 'not-allowed' }}>
              {busy ? 'Cancelling...' : 'Cancel my project'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(''); }}
              style={{ padding: '0.75rem 1.3rem', background: 'transparent', color: '#ddd', border: '1px solid #444', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: 'pointer' }}>
              Keep my project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

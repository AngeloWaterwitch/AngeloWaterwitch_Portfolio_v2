'use client';

import { useState } from 'react';
import { formatRands } from '@/lib/format';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const label: React.CSSProperties = { ...mono, fontSize: '0.68rem', color: 'var(--cr-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' };

type Props = {
  projectId: string;
  status: string;
  currency: string;
  totalCents: number;
  depositCents: number;
  depositPaidAt: string | null;
  finalPaidAt: string | null;
  hasAgreement: boolean;
  agreementAccepted: boolean;
  payfastReady: boolean;
};

export default function PaymentPanel(p: Props) {
  const [busy, setBusy] = useState<'DEPOSIT' | 'FINAL' | null>(null);
  const [error, setError] = useState('');
  const balance = Math.max(p.totalCents - p.depositCents, 0);
  if (p.totalCents <= 0 || p.status === 'CANCELLED') return null;

  const pay = async (kind: 'DEPOSIT' | 'FINAL') => {
    setBusy(kind); setError('');
    try {
      const res = await fetch('/api/client/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: p.projectId, kind }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || 'Could not start the payment.'); setBusy(null); return; }
      // Hand the customer to PayFast's secure page with the signed details.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = j.action;
      for (const [k, v] of j.fields as [string, string][]) {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = v;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch { setError('No connection. Please try again.'); setBusy(null); }
  };

  const depositState = (() => {
    if (p.depositPaidAt) return { kind: 'paid' as const };
    if (p.depositCents <= 0) return { kind: 'none' as const };
    if (!p.hasAgreement) return { kind: 'blocked' as const, why: 'Your agreement is being prepared. You can pay once it is ready.' };
    if (!p.agreementAccepted) return { kind: 'blocked' as const, why: 'Accept your agreement above to unlock the deposit payment.' };
    return { kind: 'due' as const };
  })();

  const finalState = (() => {
    if (p.finalPaidAt) return { kind: 'paid' as const };
    if (balance <= 0) return { kind: 'none' as const };
    if (!p.depositPaidAt) return { kind: 'blocked' as const, why: 'Opens after the deposit is paid.' };
    if (!['IN_REVIEW', 'COMPLETED'].includes(p.status)) return { kind: 'blocked' as const, why: 'Opens when your finished work is ready for your approval.' };
    return { kind: 'due' as const };
  })();

  const row = (title: string, cents: number, state: { kind: 'paid' | 'none' | 'blocked' | 'due'; why?: string }, kind: 'DEPOSIT' | 'FINAL', paidAt: string | null, note?: string) => {
    if (state.kind === 'none') return null;
    return (
      <div style={{ padding: '0.9rem 0', borderTop: '1px solid #232323' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <div style={{ ...mono, fontSize: '0.8rem', marginTop: '0.2rem' }}>{formatRands(cents, p.currency)}</div>
          </div>
          {state.kind === 'paid' && <span style={{ ...mono, fontSize: '0.74rem', color: '#4caf50' }}>✓ Paid {paidAt ? new Date(paidAt).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' }) : ''}</span>}
          {state.kind === 'blocked' && <span style={{ ...mono, fontSize: '0.72rem', color: 'var(--cr-muted)', maxWidth: '20rem', lineHeight: 1.5 }}>{state.why}</span>}
          {state.kind === 'due' && (p.payfastReady ? (
            <button type="button" disabled={busy !== null} onClick={() => pay(kind)}
              style={{ padding: '0.8rem 1.4rem', background: busy ? '#2a2a2a' : 'var(--cr-primary, #cc0033)', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: busy ? 'not-allowed' : 'pointer' }}>
              {busy === kind ? 'Opening PayFast...' : `Pay ${formatRands(cents, p.currency)}`}
            </button>
          ) : (
            <span style={{ ...mono, fontSize: '0.72rem', color: '#e0a030', maxWidth: '20rem', lineHeight: 1.5 }}>Online payment is not switched on yet. Please contact Angelo to pay by EFT.</span>
          ))}
        </div>
        {state.kind === 'due' && note && <p style={{ ...mono, fontSize: '0.7rem', color: '#e0a030', lineHeight: 1.6, marginTop: '0.7rem' }}>{note}</p>}
      </div>
    );
  };

  return (
    <div style={{ marginTop: '1.6rem' }}>
      <h3 style={{ ...label, marginBottom: '0.3rem' }}>Payments</h3>
      {row('Deposit', p.depositCents, depositState, 'DEPOSIT', p.depositPaidAt,
        'The deposit is non-refundable once paid: it reserves my time and covers the start of your custom work. You can cancel at any time, and until the deposit is paid cancelling costs nothing.')}
      {row('Final balance', balance, finalState, 'FINAL', p.finalPaidAt,
        'The website goes live and the files are handed over after this payment.')}
      {(depositState.kind === 'due' || finalState.kind === 'due') && p.payfastReady && (
        <p style={{ ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', lineHeight: 1.6, marginTop: '0.4rem' }}>
          Payments are made on PayFast&apos;s secure page (card or Instant EFT). Your card or bank details never reach this website.
        </p>
      )}
      {error && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'var(--cr-light, #ff1a47)', marginTop: '0.6rem' }}>{error}</div>}
    </div>
  );
}

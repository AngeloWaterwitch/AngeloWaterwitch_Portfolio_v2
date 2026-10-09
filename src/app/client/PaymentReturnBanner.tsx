'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type State = { kind: 'idle' } | { kind: 'waiting' } | { kind: 'paid' } | { kind: 'cancelled' } | { kind: 'slow' } | { kind: 'failed' };

/**
 * PayFast sends the customer back here, but the payment is only real once PayFast's server confirms it. This watches
 * for that confirmation for up to a minute so the customer sees a clear result.
 */
export default function PaymentReturnBanner() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const kind = q.get('payment');
    const ref = q.get('ref');
    if (!kind || !ref) return;

    if (kind === 'cancelled') { setState({ kind: 'cancelled' }); window.history.replaceState(null, '', '/client'); return; }
    if (kind !== 'return') return;

    setState({ kind: 'waiting' });
    let stop = false;
    let tries = 0;
    const poll = async () => {
      if (stop) return;
      tries++;
      try {
        const res = await fetch('/api/client/payments/' + encodeURIComponent(ref), { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          if (j.status === 'COMPLETE') { setState({ kind: 'paid' }); window.history.replaceState(null, '', '/client'); router.refresh(); return; }
          if (j.status === 'FAILED' || j.status === 'CANCELLED') { setState({ kind: 'failed' }); window.history.replaceState(null, '', '/client'); return; }
        }
      } catch { /* try again */ }
      if (tries >= 20) { setState({ kind: 'slow' }); return; }
      setTimeout(poll, 3000);
    };
    poll();
    return () => { stop = true; };
  }, [router]);

  if (state.kind === 'idle') return null;
  const m = {
    waiting: { c: '#e0a030', t: 'Thank you. We are confirming your payment with PayFast. This usually takes a few seconds...' },
    paid: { c: '#4caf50', t: 'Payment received. Thank you! A receipt is in your documents.' },
    cancelled: { c: '#9a9a9a', t: 'The payment was cancelled. Nothing was charged.' },
    failed: { c: '#ff7a95', t: 'The payment did not go through. Nothing was charged. You can try again.' },
    slow: { c: '#e0a030', t: 'We have not received PayFast\'s confirmation yet. If you completed the payment it will appear here shortly. You can refresh this page in a few minutes.' },
  }[state.kind];

  return (
    <div role="status" aria-live="polite" style={{ border: '1px solid ' + m.c, color: m.c, padding: '0.9rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6, borderRadius: '2px', background: 'rgba(255,255,255,0.02)' }}>
      {m.t}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Active = { startedAt: string; overtime: boolean } | null;
type Pending = { id: string; reason: string; estimatedMinutes: number; plannedFor: string | null } | null;
export type LiveState = {
  active: Active;
  lastWorkedAt: string | null;
  totalMinutes: number;
  overtimeMinutes: number;
  pendingOvertime: Pending;
};

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const POLL_MS = 20_000;

function hm(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}
function when(iso: string) {
  return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' });
}

export default function ProjectLive({ projectId, initial, serverNow }: { projectId: string; initial: LiveState; serverNow: number }) {
  const router = useRouter();
  const [live, setLive] = useState<LiveState>(initial);
  const skew = useRef(serverNow - Date.now()); // server clock minus this device's clock
  const [now, setNow] = useState(() => Date.now() + skew.current);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/client/live', { cache: 'no-store' });
      if (res.status === 401) { router.push('/client/login'); return; }
      if (!res.ok) return;
      const json = await res.json();
      skew.current = new Date(json.now).getTime() - Date.now();
      const mine = json.projects.find((p: any) => p.id === projectId);
      if (mine) setLive({ active: mine.active, lastWorkedAt: mine.lastWorkedAt, totalMinutes: mine.totalMinutes, overtimeMinutes: mine.overtimeMinutes, pendingOvertime: mine.pendingOvertime });
    } catch { /* offline: keep showing the last known state */ }
  }, [projectId, router]);

  // Poll while the tab is visible, and refresh as soon as it becomes visible again.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') refresh(); };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);

  // Ticking clock while work is in progress.
  useEffect(() => {
    if (!live.active) return;
    const id = setInterval(() => setNow(Date.now() + skew.current), 1000);
    return () => clearInterval(id);
  }, [live.active]);

  const decide = async (decision: 'ACCEPTED' | 'DECLINED') => {
    if (!live.pendingOvertime || busy) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/client/overtime/' + live.pendingOvertime.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Something went wrong. Please try again.');
      } else {
        setNote('');
        await refresh();
        router.refresh(); // reload the server-rendered activity log
      }
    } catch { setError('Could not connect. Please try again.'); }
    setBusy(false);
  };

  const a = live.active;
  const elapsed = a ? now - new Date(a.startedAt).getTime() : 0;
  const o = live.pendingOvertime;

  return (
    <div style={{ marginTop: '1.4rem' }}>
      {/* live status */}
      <div role="status" aria-live="polite" style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', padding: '0.9rem 1.1rem', borderRadius: '2px',
        background: a ? 'rgba(76,175,80,0.08)' : '#121212', border: '1px solid ' + (a ? 'rgba(76,175,80,0.45)' : '#242424'),
      }}>
        <span aria-hidden className={a ? 'live-dot' : undefined} style={{ width: '10px', height: '10px', borderRadius: '50%', background: a ? '#4caf50' : '#555', flexShrink: 0 }} />
        {a ? (
          <>
            <span style={{ fontWeight: 700 }}>Angelo is working on this right now</span>
            <span style={{ ...mono, fontSize: '0.8rem', color: '#4caf50' }}>{clock(elapsed)}</span>
            {a.overtime && <span style={{ ...mono, fontSize: '0.66rem', color: '#e0a030', border: '1px solid #e0a030', padding: '0.1rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overtime you confirmed</span>}
          </>
        ) : (
          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
            Not working on this at the moment{live.lastWorkedAt ? <> · last worked <span style={{ color: '#ddd' }}>{when(live.lastWorkedAt)}</span></> : ''}
          </span>
        )}
        <span style={{ ...mono, fontSize: '0.7rem', color: 'var(--cr-muted)', marginLeft: 'auto' }}>
          Total time: {hm(live.totalMinutes)}{live.overtimeMinutes > 0 ? ` (overtime ${hm(live.overtimeMinutes)})` : ''}
        </span>
      </div>

      {/* overtime question */}
      {o && (
        <div role="group" aria-label="Overtime request" style={{ marginTop: '1rem', padding: '1.1rem 1.2rem', border: '1px solid #e0a030', background: 'rgba(224,160,48,0.07)', borderRadius: '2px' }}>
          <div style={{ ...mono, fontSize: '0.7rem', color: '#e0a030', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Overtime — your answer needed</div>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.7 }}>
            Angelo plans to work about <strong style={mono}>{hm(o.estimatedMinutes)}</strong> of overtime{o.plannedFor ? <> on <strong style={mono}>{when(o.plannedFor)}</strong></> : ''}.
          </p>
          <p style={{ color: '#bbb', fontSize: '0.88rem', lineHeight: 1.7, marginTop: '0.4rem' }}>Reason: {o.reason}</p>
          <p style={{ color: 'var(--cr-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginTop: '0.8rem' }}>
            Please tell us whether you require this. Overtime is only recorded as requested by you if you choose &ldquo;Yes&rdquo;.
          </p>
          <label htmlFor={'ot-note-' + o.id} style={{ display: 'block', ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0.9rem 0 0.4rem' }}>Note (optional)</label>
          <textarea id={'ot-note-' + o.id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
            style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', color: 'var(--cr-text, #f0ede8)', padding: '0.6rem 0.8rem', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', borderRadius: '1px', resize: 'vertical' }} />
          {error && <div role="alert" style={{ ...mono, fontSize: '0.72rem', color: 'var(--cr-light, #ff1a47)', marginTop: '0.6rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button type="button" disabled={busy} onClick={() => decide('ACCEPTED')} style={{ padding: '0.7rem 1.3rem', background: busy ? '#2a2a2a' : 'var(--cr-primary, #cc0033)', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: busy ? 'not-allowed' : 'pointer' }}>
              Yes, I require this
            </button>
            <button type="button" disabled={busy} onClick={() => decide('DECLINED')} style={{ padding: '0.7rem 1.3rem', background: 'transparent', color: '#ddd', border: '1px solid #444', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: busy ? 'not-allowed' : 'pointer' }}>
              No, not required
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

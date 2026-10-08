'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminField } from './AdminField';
import { AdminGrid } from './AdminGrid';
import { AdminToggle } from './AdminToggle';
import { formatDateTime } from '@/lib/format';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const btn = (primary = false, danger = false, green = false): React.CSSProperties => ({
  padding: '0.5rem 1rem', background: green ? '#2e7d32' : primary ? 'hsl(348,100%,40%)' : 'transparent',
  border: '1px solid ' + (green ? '#2e7d32' : danger ? 'hsl(348,100%,35%)' : primary ? 'hsl(348,100%,40%)' : '#333'),
  color: danger ? 'hsl(348,100%,62%)' : primary || green ? '#fff' : '#bbb', ...mono, fontSize: '0.7rem',
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '1px',
});
const sub: React.CSSProperties = { ...mono, fontSize: '0.72rem', color: '#f0ede8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1.4rem 0 0.7rem' };

const STATUS_LABEL: Record<string, string> = { PENDING: 'Waiting for client', ACCEPTED: 'Client requires it', DECLINED: 'Client: not required', CANCELLED: 'Withdrawn' };
const STATUS_COLOR: Record<string, string> = { PENDING: '#e0a030', ACCEPTED: '#4caf50', DECLINED: '#888', CANCELLED: '#666' };

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ? (json?.issues?.[0]?.message ? `${json.error}: ${json.issues[0].message}` : json.error) : 'Request failed');
  return json;
}

const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`);
const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':'); };
const mins = (a: string, b: string | null) => Math.max(0, Math.round(((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / 60000));

export function WorkPanel({ projectId, locked }: { projectId: string; locked: boolean }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [overtime, setOvertime] = useState(false);
  const [summary, setSummary] = useState('');
  const [ot, setOt] = useState({ reason: '', hours: '', plannedFor: '' });
  const [manual, setManual] = useState({ start: '', end: '', summary: '', overtime: false });

  const load = useCallback(async () => {
    try { setData(await api(`/api/admin/projects/${projectId}/work`)); } catch (e) { setError((e as Error).message); }
  }, [projectId]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 20_000); // pick up the client's overtime answer
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!data?.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [data?.active]);

  const act = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); await load(); } catch (e) { setError((e as Error).message); }
  };

  if (!data) return <p style={{ ...mono, fontSize: '0.72rem', color: '#777', marginTop: '1rem' }}>{error || 'Loading work log...'}</p>;

  const active = data.active;
  const pending = data.overtimeRequests.find((r: any) => r.status === 'PENDING');
  const accepted = !!data.allowance;

  return (
    <div style={{ borderTop: '1px solid #222', marginTop: '1.8rem', paddingTop: '0.4rem' }}>
      <div style={sub}>Work &amp; time</div>
      {error && <div role="alert" style={{ ...mono, fontSize: '0.72rem', color: 'hsl(348,100%,62%)', marginBottom: '0.8rem' }}>{error}</div>}

      <div style={{ ...mono, fontSize: '0.74rem', color: '#bbb', marginBottom: '0.9rem' }}>
        Total: <strong style={{ color: '#f0ede8' }}>{hm(data.totals.totalMinutes)}</strong> · Overtime: <strong style={{ color: '#f0ede8' }}>{hm(data.totals.overtimeMinutes)}</strong> · Sessions: {data.totals.sessionCount}
      </div>

      {active ? (
        <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.45)', padding: '0.9rem 1rem', marginBottom: '1rem' }}>
          <div style={{ ...mono, fontSize: '0.8rem', color: '#4caf50' }}>
            ● Working{active.overtime ? ' (overtime)' : ''} since {formatDateTime(active.startedAt)} — {clock(now - new Date(active.startedAt).getTime())}
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <AdminField label="What did you do? (shown in the log)" value={summary} onChange={setSummary} textarea fullWidth />
          </div>
          <div style={{ marginTop: '0.7rem' }}>
            <button type="button" style={btn(true)} onClick={() => act(async () => { await api(`/api/admin/projects/${projectId}/work`, 'POST', { action: 'stop', summary }); setSummary(''); })}>Stop work</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" style={btn(false, false, true)} disabled={locked} onClick={() => act(async () => { await api(`/api/admin/projects/${projectId}/work`, 'POST', { action: 'start', overtime }); })}>
              ▶ Start work
            </button>
            <label style={{ ...mono, fontSize: '0.72rem', color: accepted ? '#ddd' : '#777', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input type="checkbox" checked={overtime} onChange={(e) => setOvertime(e.target.checked)} style={{ accentColor: 'hsl(348,100%,45%)' }} />
              This is overtime {accepted ? `(${hm(data.allowance.remainingMinutes)} confirmed by the client)` : '(needs the client to confirm first)'}
            </label>
          </div>
          {locked && <p style={{ ...mono, fontSize: '0.68rem', color: '#777', marginTop: '0.5rem' }}>Work cannot be started on a finished or cancelled project.</p>}
        </div>
      )}

      <div style={sub}>Overtime</div>
      {data.overtimeRequests.map((r: any) => (
        <div key={r.id} style={{ border: '1px solid #222', padding: '0.7rem 0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ ...mono, fontSize: '0.68rem', color: STATUS_COLOR[r.status], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{STATUS_LABEL[r.status]} · ~{hm(r.estimatedMinutes)}</div>
            <div style={{ fontSize: '0.85rem', color: '#ddd', marginTop: '0.2rem' }}>{r.reason}</div>
            {r.clientNote && <div style={{ fontSize: '0.78rem', color: '#999', marginTop: '0.2rem' }}>Client note: {r.clientNote}</div>}
          </div>
          {r.status === 'PENDING' && <button type="button" style={btn(false, true)} onClick={() => act(() => api('/api/admin/overtime/' + r.id, 'DELETE'))}>Withdraw</button>}
        </div>
      ))}
      {!pending && !locked && (
        <div>
          <AdminGrid>
            <AdminField label="Why is overtime needed?" value={ot.reason} onChange={(v) => setOt({ ...ot, reason: v })} textarea fullWidth />
            <AdminField label="Estimated hours" value={ot.hours} onChange={(v) => setOt({ ...ot, hours: v })} placeholder="3" />
            <div>
              <div style={{ ...mono, fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Planned for (optional)</div>
              <input type="datetime-local" value={ot.plannedFor} onChange={(e) => setOt({ ...ot, plannedFor: e.target.value })}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.55rem 0.8rem', borderRadius: '1px', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', colorScheme: 'dark' }} />
            </div>
          </AdminGrid>
          <button type="button" style={btn(true)} onClick={() => act(async () => {
            await api(`/api/admin/projects/${projectId}/overtime`, 'POST', { reason: ot.reason, estimatedHours: Number(ot.hours), ...(ot.plannedFor ? { plannedFor: new Date(ot.plannedFor).toISOString() } : {}) });
            setOt({ reason: '', hours: '', plannedFor: '' });
          })}>Declare overtime &amp; ask client</button>
        </div>
      )}

      <div style={sub}>Sessions</div>
      {data.sessions.length === 0 && <p style={{ ...mono, fontSize: '0.72rem', color: '#777' }}>No sessions yet.</p>}
      {data.sessions.slice(0, 15).map((s: any) => (
        <div key={s.id} style={{ borderTop: '1px solid #1f1f1f', padding: '0.55rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ ...mono, fontSize: '0.7rem', color: '#bbb' }}>
              {formatDateTime(s.startedAt)} · {hm(mins(s.startedAt, s.endedAt))}{s.endedAt ? '' : ' (running)'}{s.overtime ? ' · OVERTIME' : ''}
            </div>
            {s.summary && <div style={{ fontSize: '0.8rem', color: '#999' }}>{s.summary}</div>}
          </div>
          {s.endedAt && <button type="button" style={btn(false, true)} onClick={() => confirm('Remove this session? A note that it was removed stays in the log.') && act(() => api('/api/admin/work-sessions/' + s.id, 'DELETE'))}>Remove</button>}
        </div>
      ))}

      <details style={{ marginTop: '1rem' }}>
        <summary style={{ ...mono, fontSize: '0.7rem', color: '#bbb', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Add time I forgot to track</summary>
        <div style={{ marginTop: '0.8rem' }}>
          <AdminGrid>
            {(['start', 'end'] as const).map((k) => (
              <div key={k}>
                <div style={{ ...mono, fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{k === 'start' ? 'Started' : 'Finished'}</div>
                <input type="datetime-local" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.55rem 0.8rem', borderRadius: '1px', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', colorScheme: 'dark' }} />
              </div>
            ))}
            <AdminField label="What was done" value={manual.summary} onChange={(v) => setManual({ ...manual, summary: v })} textarea fullWidth />
            <AdminToggle label="Overtime" checked={manual.overtime} onChange={(v) => setManual({ ...manual, overtime: v })} />
          </AdminGrid>
          <button type="button" style={btn(true)} onClick={() => act(async () => {
            await api(`/api/admin/projects/${projectId}/work`, 'POST', { action: 'manual', startedAt: new Date(manual.start).toISOString(), endedAt: new Date(manual.end).toISOString(), summary: manual.summary, overtime: manual.overtime });
            setManual({ start: '', end: '', summary: '', overtime: false });
          })}>Add time</button>
        </div>
      </details>

      <div style={sub}>Documentation</div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
        <a href={`/api/admin/projects/${projectId}/worklog?format=pdf`} style={{ ...btn(), textDecoration: 'none' }}>Download PDF</a>
        <a href={`/api/admin/projects/${projectId}/worklog?format=csv`} style={{ ...btn(), textDecoration: 'none' }}>Download CSV</a>
      </div>
      <details>
        <summary style={{ ...mono, fontSize: '0.7rem', color: '#bbb', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Activity log ({data.log.length}{data.log.length === 100 ? '+' : ''})</summary>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0.8rem 0 0' }}>
          {data.log.slice(0, 30).map((e: any) => (
            <li key={e.id} style={{ borderTop: '1px solid #1f1f1f', padding: '0.4rem 0', fontSize: '0.8rem', color: '#ccc' }}>
              <span style={{ ...mono, fontSize: '0.66rem', color: '#777' }}>{formatDateTime(e.createdAt)}</span>{'  '}{e.message}{e.visibleToClient ? '' : ' (hidden from client)'}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

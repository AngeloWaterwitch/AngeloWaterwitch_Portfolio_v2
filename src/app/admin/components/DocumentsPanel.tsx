'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/format';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const btn = (primary = false): React.CSSProperties => ({
  padding: '0.5rem 1rem', background: primary ? 'hsl(348,100%,40%)' : 'transparent', border: '1px solid ' + (primary ? 'hsl(348,100%,40%)' : '#333'),
  color: primary ? '#fff' : '#bbb', ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '1px', textDecoration: 'none', display: 'inline-block',
});
const chip = (color: string): React.CSSProperties => ({ ...mono, fontSize: '0.64rem', padding: '0.12rem 0.5rem', border: '1px solid ' + color, color, borderRadius: '999px', marginLeft: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' });

type Doc = {
  id: string; type: string; title: string; version: number; projectId: string | null; requiresAcceptance: boolean; superseded: boolean;
  acceptedAt: string | null; acceptedName: string | null; emailedAt: string | null; emailError: string | null; createdAt: string; stale: boolean;
};

export function DocumentsPanel({ clientId, projects, closed }: { clientId: string; projects: { id: string; title: string }[]; closed: boolean }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [businessReady, setBusinessReady] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [includeNda, setIncludeNda] = useState(true);
  const [email, setEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await (await fetch(`/api/admin/clients/${clientId}/documents`, { cache: 'no-store' })).json();
      setDocs(j.documents ?? []);
      setBusinessReady(!!j.businessReady);
    } catch { /* keep what we have */ }
    setLoaded(true);
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  const post = async (body: unknown) => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok && !j.error) setMsg({ ok: false, text: 'Something went wrong.' });
      else if (j.error) setMsg({ ok: false, text: j.error });
      else if (j.issued !== undefined) setMsg({ ok: !j.email || j.email.ok, text: `Issued ${j.issued} documents.` + (j.email ? (j.email.ok ? ' Emailed to the client.' : ` Not emailed: ${j.email.error}`) : '') });
      else setMsg({ ok: !!j.ok, text: j.ok ? 'Emailed to the client.' : `Not emailed: ${j.error ?? 'unknown reason'}` });
    } catch { setMsg({ ok: false, text: 'No connection.' }); }
    await load();
    setBusy(false);
  };

  const current = docs.filter((d) => !d.superseded);
  const older = docs.filter((d) => d.superseded);

  return (
    <div>
      {!businessReady && (
        <div role="alert" style={{ ...mono, fontSize: '0.72rem', color: '#d8c27a', border: '1px solid #5a4a1a', background: '#1c180c', padding: '0.7rem 0.9rem', marginBottom: '0.8rem', lineHeight: 1.6 }}>
          Fill in the <strong>Business &amp; Legal</strong> tab first. The documents need your details.
        </div>
      )}

      {!closed && projects.length > 0 && (
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          {projects.length > 1 && (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project" style={{ background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.5rem', fontFamily: "'Syne', sans-serif" }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
          <label style={{ ...mono, fontSize: '0.7rem', color: '#bbb', display: 'flex', gap: '0.35rem', alignItems: 'center' }}><input type="checkbox" checked={includeNda} onChange={(e) => setIncludeNda(e.target.checked)} /> Include NDA</label>
          <label style={{ ...mono, fontSize: '0.7rem', color: '#bbb', display: 'flex', gap: '0.35rem', alignItems: 'center' }}><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Email to client</label>
          <button type="button" style={btn(true)} disabled={busy || !businessReady} onClick={() => post({ action: 'issue', projectId, includeNda, email })}>{current.some((d) => d.type !== 'RECEIPT') ? 'Re-issue documents' : 'Issue documents'}</button>
          {current.some((d) => d.type !== 'RECEIPT') && <button type="button" style={btn()} disabled={busy} onClick={() => post({ action: 'email' })}>Email current documents</button>}
        </div>
      )}
      {msg && <div role="status" style={{ ...mono, fontSize: '0.72rem', color: msg.ok ? '#6fcf73' : '#ff8aa0', marginBottom: '0.8rem', lineHeight: 1.6 }}>{msg.text}</div>}

      {loaded && current.length === 0 && <p style={{ ...mono, fontSize: '0.72rem', color: '#777' }}>No documents issued yet.</p>}
      {current.map((d) => (
        <div key={d.id} style={{ borderTop: '1px solid #1f1f1f', padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.9rem', color: '#f0ede8' }}>{d.title}</span>
            <span style={{ ...mono, fontSize: '0.64rem', color: '#777', marginLeft: '0.5rem' }}>v{d.version}</span>
            {d.requiresAcceptance && (d.acceptedAt ? <span style={chip('#4caf50')}>accepted</span> : <span style={chip('#e0a030')}>waiting for client</span>)}
            {d.stale && <span style={chip('#ff8aa0')}>out of date: amounts changed, re-issue</span>}
            {d.emailError ? <span style={chip('#ff8aa0')}>not emailed</span> : d.emailedAt ? <span style={chip('#3fa7ff')}>emailed</span> : null}
            <div style={{ ...mono, fontSize: '0.66rem', color: '#777', marginTop: '0.2rem' }}>
              Issued {formatDateTime(d.createdAt)}
              {d.acceptedAt ? ` · accepted ${formatDateTime(d.acceptedAt)} by ${d.acceptedName}` : ''}
            </div>
            {d.emailError && <div style={{ ...mono, fontSize: '0.64rem', color: '#ff8aa0', marginTop: '0.2rem', lineHeight: 1.5 }}>{d.emailError}</div>}
          </div>
          <a href={`/api/admin/documents/${d.id}/pdf`} target="_blank" rel="noreferrer" style={btn()}>View PDF</a>
        </div>
      ))}

      {older.length > 0 && (
        <details style={{ marginTop: '0.8rem' }}>
          <summary style={{ ...mono, fontSize: '0.68rem', color: '#999', cursor: 'pointer' }}>Earlier versions ({older.length})</summary>
          {older.map((d) => (
            <div key={d.id} style={{ ...mono, fontSize: '0.68rem', color: '#888', padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>{d.title} v{d.version}{d.acceptedAt ? ` (was accepted ${formatDateTime(d.acceptedAt)})` : ''}</span>
              <a href={`/api/admin/documents/${d.id}/pdf`} target="_blank" rel="noreferrer" style={{ color: '#bbb' }}>PDF</a>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

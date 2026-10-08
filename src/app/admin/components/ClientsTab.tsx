'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLabel } from './AdminLabel';
import { AdminField } from './AdminField';
import { AdminGrid } from './AdminGrid';
import { AdminToggle } from './AdminToggle';
import { WorkPanel } from './WorkPanel';
import { PROJECT_STATUS_LABEL, formatDate, formatDateTime } from '@/lib/format';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const btn = (primary = false, danger = false): React.CSSProperties => ({
  padding: '0.5rem 1rem', background: primary ? 'hsl(348,100%,40%)' : 'transparent',
  border: '1px solid ' + (danger ? 'hsl(348,100%,35%)' : primary ? 'hsl(348,100%,40%)' : '#333'),
  color: danger ? 'hsl(348,100%,62%)' : primary ? '#fff' : '#bbb', ...mono, fontSize: '0.7rem',
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '1px',
});
const card: React.CSSProperties = { background: '#141414', border: '1px solid #222', padding: '1rem 1.1rem', marginBottom: '0.8rem' };
const selectStyle: React.CSSProperties = { width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.6rem 0.8rem', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', borderRadius: '1px' };

const STATUSES = ['QUOTED', 'DEPOSIT_PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];
const CLIENT_STATUS_COLOR: Record<string, string> = { ACTIVE: '#4caf50', COMPLETED: '#3fa7ff', CANCELLED: '#888' };

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issue = json?.issues?.[0]?.message;
    throw new Error(json?.error ? (issue ? `${json.error}: ${issue}` : json.error) : 'Request failed');
  }
  return json;
}

const toRands = (cents: number) => String(cents / 100);

export function ClientsTab() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newCode, setNewCode] = useState<{ code: string; forName: string } | null>(null);
  const [error, setError] = useState('');

  const loadList = useCallback(async () => {
    try { setClients(await api('/api/admin/clients')); } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, []);
  useEffect(() => { loadList(); }, [loadList]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setError('');
    try { await fn(); } catch (e) { setError((e as Error).message); }
  }, []);

  return (
    <div>
      <AdminLabel>Clients</AdminLabel>
      {error && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'hsl(348,100%,62%)', marginBottom: '1rem' }}>{error}</div>}

      {newCode && (
        <div style={{ ...card, border: '1px solid hsl(348,100%,40%)', background: '#1b0f12' }}>
          <div style={{ ...mono, fontSize: '0.72rem', color: 'hsl(348,100%,62%)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
            Access code for {newCode.forName} — shown only once
          </div>
          <div style={{ ...mono, fontSize: '1.4rem', color: '#f0ede8', letterSpacing: '0.1em', wordBreak: 'break-all' }}>{newCode.code}</div>
          <p style={{ ...mono, fontSize: '0.7rem', color: '#999', lineHeight: 1.6, margin: '0.7rem 0 1rem' }}>
            Copy it now and send it to the client yourself. It is not stored, so it cannot be shown again. If it is lost, issue a new one.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" style={btn(true)} onClick={() => navigator.clipboard?.writeText(newCode.code)}>Copy code</button>
            <button type="button" style={btn()} onClick={() => setNewCode(null)}>I have copied it</button>
          </div>
        </div>
      )}

      {!selected && !showNew && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" style={btn(true)} onClick={() => setShowNew(true)}>+ New client</button>
          </div>
          {loading && <p style={{ ...mono, fontSize: '0.75rem', color: '#777' }}>Loading...</p>}
          {!loading && clients.length === 0 && <p style={{ ...mono, fontSize: '0.75rem', color: '#777' }}>No clients yet.</p>}
          {clients.map((c) => (
            <button key={c.id} type="button" onClick={() => setSelected(c.id)} style={{ ...card, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'block', color: '#f0ede8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <strong style={{ fontFamily: "'Syne', sans-serif" }}>{c.name}</strong>
                <span style={{ ...mono, fontSize: '0.68rem', color: CLIENT_STATUS_COLOR[c.status], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.status}</span>
              </div>
              <div style={{ ...mono, fontSize: '0.7rem', color: '#888', marginTop: '0.3rem' }}>
                {c.email} · {c.projects.length} project{c.projects.length === 1 ? '' : 's'} · code …{c.accessCodeHint}
                {c.lastLoginAt ? ` · last login ${formatDate(c.lastLoginAt)}` : ' · never logged in'}
              </div>
            </button>
          ))}
        </>
      )}

      {showNew && (
        <NewClientForm
          onCancel={() => setShowNew(false)}
          onCreated={(client, code) => { setShowNew(false); setNewCode({ code, forName: client.name }); loadList(); }}
        />
      )}

      {selected && (
        <ClientDetail
          id={selected}
          onBack={() => { setSelected(null); loadList(); }}
          onCode={(code, forName) => setNewCode({ code, forName })}
          run={run}
        />
      )}
    </div>
  );
}

function NewClientForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (client: any, code: string) => void }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', title: '', description: '', total: '', deposit: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      const out = await api('/api/admin/clients', 'POST', {
        name: f.name, email: f.email, phone: f.phone, company: f.company,
        project: { title: f.title, description: f.description, totalRands: Number(f.total) || 0, depositRands: Number(f.deposit) || 0 },
      });
      onCreated(out.client, out.accessCode);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div>
      <AdminLabel>New client</AdminLabel>
      <AdminGrid>
        <AdminField label="Full name" value={f.name} onChange={set('name')} />
        <AdminField label="Email" value={f.email} onChange={set('email')} />
        <AdminField label="Phone (optional)" value={f.phone} onChange={set('phone')} />
        <AdminField label="Company (optional)" value={f.company} onChange={set('company')} />
      </AdminGrid>
      <AdminLabel>First project</AdminLabel>
      <AdminGrid>
        <AdminField label="Project title" value={f.title} onChange={set('title')} fullWidth />
        <AdminField label="Description" value={f.description} onChange={set('description')} textarea fullWidth />
        <AdminField label="Total price (R)" value={f.total} onChange={set('total')} placeholder="15000" />
        <AdminField label="Deposit (R)" value={f.deposit} onChange={set('deposit')} placeholder="7500" />
      </AdminGrid>
      {err && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'hsl(348,100%,62%)', margin: '0.5rem 0 1rem' }}>{err}</div>}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button type="button" style={btn(true)} disabled={busy} onClick={submit}>{busy ? 'Creating...' : 'Create client & generate code'}</button>
        <button type="button" style={btn()} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ClientDetail({ id, onBack, onCode, run }: { id: string; onBack: () => void; onCode: (code: string, name: string) => void; run: (fn: () => Promise<void>) => Promise<void> }) {
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [newProject, setNewProject] = useState({ title: '', total: '', deposit: '' });

  const load = useCallback(async () => {
    const c = await api('/api/admin/clients/' + id);
    setClient(c);
    setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '' });
  }, [id]);
  useEffect(() => { run(load); }, [load, run]);

  if (!client) return <p style={{ ...mono, fontSize: '0.75rem', color: '#777' }}>Loading...</p>;

  const patch = (body: any, after?: (out: any) => void) =>
    run(async () => {
      const out = await api('/api/admin/clients/' + id, 'PATCH', body);
      if (out.accessCode) onCode(out.accessCode, client.name);
      setClient(out.client);
      after?.(out);
    });

  const active = client.status === 'ACTIVE';

  return (
    <div>
      <button type="button" style={{ ...btn(), marginBottom: '1.2rem' }} onClick={onBack}>← All clients</button>

      <AdminLabel>{client.name}</AdminLabel>
      <AdminGrid>
        <AdminField label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <AdminField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <AdminField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <AdminField label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
      </AdminGrid>
      <button type="button" style={btn(true)} onClick={() => patch({ action: 'update', ...form })}>Save details</button>

      <AdminLabel>Access code &amp; contract</AdminLabel>
      <div style={card}>
        <div style={{ ...mono, fontSize: '0.74rem', color: '#bbb', lineHeight: 1.8 }}>
          Status: <strong style={{ color: CLIENT_STATUS_COLOR[client.status] }}>{client.status}</strong><br />
          Code: AW-••••-••••-••••-{client.accessCodeHint} (issued {formatDate(client.codeIssuedAt)})<br />
          {client.codeExpiresAt && <>Code expired: {formatDateTime(client.codeExpiresAt)}<br /></>}
          Last login: {client.lastLoginAt ? formatDateTime(client.lastLoginAt) : 'never'}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {active && <button type="button" style={btn()} onClick={() => confirm('Issue a new code? The old code stops working immediately and the client is signed out.') && patch({ action: 'regenerate-code' })}>Issue new code</button>}
          {active && <button type="button" style={btn()} onClick={() => confirm('Mark this contract as finished? The client\'s code expires immediately and they are signed out.') && patch({ action: 'complete' })}>Contract finished</button>}
          {active && <button type="button" style={btn(false, true)} onClick={() => confirm('Cancel this contract? Open projects are cancelled and the client\'s access ends immediately.') && patch({ action: 'cancel' })}>Cancel contract</button>}
          {!active && <button type="button" style={btn(true)} onClick={() => confirm('Reactivate this client? A new access code is issued.') && patch({ action: 'reactivate' })}>Reactivate &amp; issue new code</button>}
        </div>
      </div>

      <AdminLabel>Projects</AdminLabel>
      {client.projects.map((p: any) => (
        <ProjectEditor key={p.id} project={p} run={run} reload={load} />
      ))}

      {active && (
        <div style={card}>
          <div style={{ ...mono, fontSize: '0.72rem', color: '#f0ede8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Add another project</div>
          <AdminGrid>
            <AdminField label="Title" value={newProject.title} onChange={(v) => setNewProject({ ...newProject, title: v })} fullWidth />
            <AdminField label="Total (R)" value={newProject.total} onChange={(v) => setNewProject({ ...newProject, total: v })} />
            <AdminField label="Deposit (R)" value={newProject.deposit} onChange={(v) => setNewProject({ ...newProject, deposit: v })} />
          </AdminGrid>
          <button type="button" style={btn(true)} onClick={() => run(async () => {
            await api(`/api/admin/clients/${id}/projects`, 'POST', { title: newProject.title, totalRands: Number(newProject.total) || 0, depositRands: Number(newProject.deposit) || 0 });
            setNewProject({ title: '', total: '', deposit: '' });
            await load();
          })}>Add project</button>
        </div>
      )}

      <AdminLabel>Danger zone</AdminLabel>
      <button type="button" style={btn(false, true)} onClick={() => confirm(`Permanently delete ${client.name} and all their projects and updates? This cannot be undone.`) && run(async () => { await api('/api/admin/clients/' + id, 'DELETE'); onBack(); })}>
        Delete client &amp; all data
      </button>
    </div>
  );
}

function ProjectEditor({ project, run, reload }: { project: any; run: (fn: () => Promise<void>) => Promise<void>; reload: () => Promise<void> }) {
  const [p, setP] = useState({
    title: project.title, description: project.description, status: project.status, progress: String(project.progress),
    total: toRands(project.totalCents), deposit: toRands(project.depositCents),
    depositPaid: !!project.depositPaidAt, finalPaid: !!project.finalPaidAt,
  });
  const [upd, setUpd] = useState({ title: '', body: '', progress: '', visible: true });

  const save = () => run(async () => {
    await api('/api/admin/projects/' + project.id, 'PATCH', {
      title: p.title, description: p.description, status: p.status, progress: Math.min(100, Math.max(0, Math.round(Number(p.progress) || 0))),
      totalRands: Number(p.total) || 0, depositRands: Number(p.deposit) || 0, depositPaid: p.depositPaid, finalPaid: p.finalPaid,
    });
    await reload();
  });

  const post = () => run(async () => {
    await api(`/api/admin/projects/${project.id}/updates`, 'POST', {
      title: upd.title, body: upd.body, visibleToClient: upd.visible,
      ...(upd.progress !== '' ? { progress: Math.min(100, Math.max(0, Math.round(Number(upd.progress) || 0))) } : {}),
    });
    setUpd({ title: '', body: '', progress: '', visible: true });
    await reload();
  });

  return (
    <div style={card}>
      <AdminGrid>
        <AdminField label="Project title" value={p.title} onChange={(v) => setP({ ...p, title: v })} fullWidth />
        <AdminField label="Description" value={p.description} onChange={(v) => setP({ ...p, description: v })} textarea fullWidth />
        <div>
          <div style={{ ...mono, fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Status</div>
          <select value={p.status} onChange={(e) => setP({ ...p, status: e.target.value })} style={selectStyle}>
            {STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <AdminField label="Progress (0–100)" value={p.progress} onChange={(v) => setP({ ...p, progress: v })} />
        <AdminField label="Total (R)" value={p.total} onChange={(v) => setP({ ...p, total: v })} />
        <AdminField label="Deposit (R)" value={p.deposit} onChange={(v) => setP({ ...p, deposit: v })} />
        <AdminToggle label="Deposit received" hint="Tick when the deposit has been paid (for example by EFT)." checked={p.depositPaid} onChange={(v) => setP({ ...p, depositPaid: v })} />
        <AdminToggle label="Final payment received" checked={p.finalPaid} onChange={(v) => setP({ ...p, finalPaid: v })} />
      </AdminGrid>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="button" style={btn(true)} onClick={save}>Save project</button>
        <button type="button" style={btn(false, true)} onClick={() => confirm('Delete this project and its updates?') && run(async () => { await api('/api/admin/projects/' + project.id, 'DELETE'); await reload(); })}>Delete project</button>
      </div>

      <div style={{ ...mono, fontSize: '0.72rem', color: '#f0ede8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1.6rem 0 0.8rem' }}>Post an update</div>
      <AdminGrid>
        <AdminField label="Title" value={upd.title} onChange={(v) => setUpd({ ...upd, title: v })} placeholder="Homepage design finished" fullWidth />
        <AdminField label="Details (optional)" value={upd.body} onChange={(v) => setUpd({ ...upd, body: v })} textarea fullWidth />
        <AdminField label="Set progress to (optional)" value={upd.progress} onChange={(v) => setUpd({ ...upd, progress: v })} placeholder="40" />
        <AdminToggle label="Visible to the client" checked={upd.visible} onChange={(v) => setUpd({ ...upd, visible: v })} />
      </AdminGrid>
      <button type="button" style={btn(true)} onClick={post}>Post update</button>

      <WorkPanel projectId={project.id} locked={['COMPLETED', 'CANCELLED'].includes(project.status)} />

      {project.updates.length > 0 && (
        <ol style={{ listStyle: 'none', padding: 0, margin: '1.4rem 0 0' }}>
          {project.updates.map((u: any) => (
            <li key={u.id} style={{ borderTop: '1px solid #222', padding: '0.7rem 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ ...mono, fontSize: '0.66rem', color: '#777' }}>{formatDateTime(u.createdAt)}{u.progress !== null ? ` · ${u.progress}%` : ''}{u.visibleToClient ? '' : ' · hidden from client'}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.88rem', color: '#f0ede8' }}>{u.title}</div>
                {u.body && <div style={{ fontSize: '0.8rem', color: '#999', whiteSpace: 'pre-line', marginTop: '0.2rem' }}>{u.body}</div>}
              </div>
              <button type="button" style={btn(false, true)} onClick={() => run(async () => { await api('/api/admin/updates/' + u.id, 'DELETE'); await reload(); })}>Delete</button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

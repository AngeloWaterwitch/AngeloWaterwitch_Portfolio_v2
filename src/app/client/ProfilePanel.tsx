'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const label: React.CSSProperties = { ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', margin: '0.9rem 0 0.35rem' };
const input: React.CSSProperties = { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', color: 'var(--cr-text, #f0ede8)', padding: '0.7rem 0.9rem', fontFamily: "'Syne', sans-serif", fontSize: '0.9rem', borderRadius: '1px' };
const dl: React.CSSProperties = { ...mono, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ddd', border: '1px solid #3a3a3a', padding: '0.55rem 1rem', textDecoration: 'none', borderRadius: '1px', display: 'inline-block' };

type Props = { name: string; email: string; phone: string; company: string; hasOpenProjects: boolean; depositPaid: boolean };

export default function ProfilePanel(p: Props) {
  const router = useRouter();
  const [f, setF] = useState({ name: p.name, email: p.email, phone: p.phone, company: p.company });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [openDel, setOpenDel] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [ack, setAck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/client/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: j.error || 'Could not save.' });
      else { setMsg({ ok: true, text: j.changed?.length ? 'Saved.' : 'Nothing changed.' }); router.refresh(); }
    } catch { setMsg({ ok: false, text: 'No connection. Please try again.' }); }
    setSaving(false);
  };

  const erase = async () => {
    setDeleting(true); setDelError('');
    try {
      const res = await fetch('/api/client/profile/erase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE', acknowledge: true }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setDelError(j.error || 'Something went wrong. Please try again.'); setDeleting(false); return; }
      window.location.href = '/client/deleted?until=' + encodeURIComponent(String(j.retainUntil).slice(0, 10));
    } catch { setDelError('No connection. Please try again.'); setDeleting(false); }
  };

  const delReady = confirm.trim().toUpperCase() === 'DELETE' && ack && !deleting;
  const dirty = f.name !== p.name || f.email !== p.email || f.phone !== p.phone || f.company !== p.company;

  return (
    <section aria-labelledby="profile-h" style={{ background: 'var(--cr-bg3, #1a1a1a)', border: '1px solid var(--cr-bg4, #222)', borderRadius: '2px', padding: 'clamp(1.1rem, 4vw, 1.8rem)', marginTop: '1.5rem' }}>
      <h2 id="profile-h" style={{ ...mono, fontSize: '0.68rem', color: 'var(--cr-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Your profile &amp; data</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1.2rem' }}>
        <div><label htmlFor="pf-name" style={label}>Full name</label><input id="pf-name" value={f.name} onChange={set('name')} autoComplete="name" maxLength={100} style={input} /></div>
        <div><label htmlFor="pf-email" style={label}>Email</label><input id="pf-email" type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={254} style={input} /></div>
        <div><label htmlFor="pf-phone" style={label}>Phone</label><input id="pf-phone" value={f.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} style={input} /></div>
        <div><label htmlFor="pf-company" style={label}>Company</label><input id="pf-company" value={f.company} onChange={set('company')} autoComplete="organization" maxLength={120} style={input} /></div>
      </div>
      <p style={{ ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', lineHeight: 1.6, marginTop: '0.8rem' }}>
        Documents you have already signed keep the details they were signed with.
      </p>
      <button type="button" disabled={!dirty || saving} onClick={save}
        style={{ marginTop: '0.8rem', padding: '0.7rem 1.3rem', background: dirty && !saving ? 'var(--cr-primary, #cc0033)' : '#2a2a2a', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: dirty && !saving ? 'pointer' : 'not-allowed' }}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
      {msg && <span role="status" style={{ ...mono, fontSize: '0.74rem', color: msg.ok ? '#6fcf73' : 'var(--cr-light, #ff1a47)', marginLeft: '1rem' }}>{msg.text}</span>}

      <div style={{ marginTop: '1.8rem', paddingTop: '1.2rem', borderTop: '1px solid #232323' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Download my data</h3>
        <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '0.8rem' }}>
          Get a complete copy of the information we hold about you: your details, projects, payments, messages and documents.
        </p>
        <a href="/api/client/data-export" style={dl}>Download my data (JSON)</a>
      </div>

      <div style={{ marginTop: '1.8rem', paddingTop: '1.2rem', borderTop: '1px solid #232323' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Delete my profile and data</h3>
        {!openDel ? (
          <>
            <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '0.8rem' }}>
              You can erase your personal information and close your access at any time.
            </p>
            <button type="button" onClick={() => setOpenDel(true)}
              style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: '#ff7a95', border: '1px solid #7a1f33', padding: '0.55rem 1rem', cursor: 'pointer', borderRadius: '1px' }}>
              Delete my profile and data
            </button>
          </>
        ) : (
          <div role="group" aria-label="Delete my profile and data" style={{ border: '1px solid #b3243d', background: 'rgba(179,36,61,0.07)', padding: '1.1rem 1.2rem', borderRadius: '2px' }}>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.7, fontWeight: 700 }}>This cannot be undone.</p>
            <p style={{ ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.9rem' }}>Deleted straight away</p>
            <ul style={{ margin: '0.4rem 0', paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.7, color: '#ddd' }}>
              <li>Your name, email, phone and company</li>
              <li>Your chat messages, call records, work logs and project updates</li>
              <li>Your access: you will be signed out and the portal closes</li>
            </ul>
            <p style={{ ...mono, fontSize: '0.66rem', color: 'var(--cr-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.9rem' }}>Kept for 5 years, because the law requires it</p>
            <ul style={{ margin: '0.4rem 0', paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.7, color: '#ddd' }}>
              <li>Your signed agreement, quote, receipts and payment records</li>
              <li>They are locked away, used for nothing else, and deleted when the 5 years end.</li>
            </ul>
            {p.hasOpenProjects && (
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#ffb3c0', marginTop: '0.8rem' }}>
                <strong>Your unfinished project(s) will be cancelled.</strong>{p.depositPaid ? ' A deposit you have paid is not refunded.' : ' You have not paid a deposit, so nothing is owed.'}
              </p>
            )}
            <p style={{ color: '#aaa', fontSize: '0.84rem', lineHeight: 1.6, marginTop: '0.8rem' }}>Tip: download your data above first. You will not be able to after this.</p>

            <label style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', fontSize: '0.88rem', lineHeight: 1.6, margin: '1rem 0 0.2rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ marginTop: '0.25rem' }} />
              <span>I understand what will be deleted and what must be kept.</span>
            </label>
            <label htmlFor="del-confirm" style={label}>Type DELETE to confirm</label>
            <input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" maxLength={10} style={{ ...input, maxWidth: '240px', ...mono, letterSpacing: '0.1em' }} />
            {delError && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'var(--cr-light, #ff1a47)', marginTop: '0.8rem' }}>{delError}</div>}
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
              <button type="button" disabled={!delReady} onClick={erase}
                style={{ padding: '0.75rem 1.3rem', background: delReady ? '#b3243d' : '#2a2a2a', color: '#fff', border: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: delReady ? 'pointer' : 'not-allowed' }}>
                {deleting ? 'Deleting...' : 'Delete everything'}
              </button>
              <button type="button" onClick={() => { setOpenDel(false); setDelError(''); }}
                style={{ padding: '0.75rem 1.3rem', background: 'transparent', color: '#ddd', border: '1px solid #444', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '1px', cursor: 'pointer' }}>
                Keep my profile
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

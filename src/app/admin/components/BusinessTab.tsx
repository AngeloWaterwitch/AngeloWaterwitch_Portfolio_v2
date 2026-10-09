'use client';

import { useEffect, useState } from 'react';
import { AdminLabel } from './AdminLabel';
import { AdminField } from './AdminField';
import { AdminGrid } from './AdminGrid';
import { AdminToggle } from './AdminToggle';
import { SaveButton } from './SaveButton';

const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const hint: React.CSSProperties = { ...mono, fontSize: '0.7rem', color: '#888', lineHeight: 1.6, marginBottom: '1rem' };
const btn: React.CSSProperties = { padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #333', color: '#bbb', ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '1px' };

type Form = {
  tradingName: string; legalName: string; idOrRegNumber: string; address: string; city: string; province: string;
  email: string; phone: string; vatRegistered: boolean; vatNumber: string;
  bankName: string; accountHolder: string; accountNumber: string; branchCode: string; accountType: string;
  informationOfficerName: string; informationOfficerEmail: string;
};
const EMPTY: Form = {
  tradingName: '', legalName: '', idOrRegNumber: '', address: '', city: '', province: '', email: '', phone: '', vatRegistered: false, vatNumber: '',
  bankName: '', accountHolder: '', accountNumber: '', branchCode: '', accountType: '', informationOfficerName: '', informationOfficerEmail: '',
};

export function BusinessTab() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [status, setStatus] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [check, setCheck] = useState<{ ok: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch('/api/admin/business').then((r) => r.json()).then((j) => {
      if (j.profile) setForm({ ...EMPTY, ...j.profile, vatNumber: j.profile.vatNumber ?? '' });
      setStatus(j.status);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setError('');
    const res = await fetch('/api/admin/business', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const issue = j?.issues?.[0];
      setError(issue ? `${issue.path?.join('.') || 'Form'}: ${issue.message}` : j.error || 'Could not save.');
      throw new Error('save failed');
    }
  };

  const testPayfast = async () => {
    setChecking(true); setCheck(null);
    try { setCheck(await (await fetch('/api/admin/payfast/check', { method: 'POST' })).json()); }
    catch { setCheck({ ok: false, message: 'Could not run the test.' }); }
    setChecking(false);
  };

  if (!loaded) return <p style={{ ...mono, fontSize: '0.75rem', color: '#777' }}>Loading...</p>;

  const chip = (ok: boolean, text: string) => (
    <span style={{ ...mono, fontSize: '0.68rem', padding: '0.2rem 0.6rem', border: '1px solid ' + (ok ? '#2e7d32' : '#7a1020'), color: ok ? '#6fcf73' : '#ff8aa0', borderRadius: '999px', marginRight: '0.5rem' }}>{text}</span>
  );

  return (
    <div>
      <AdminLabel>Business &amp; legal details</AdminLabel>
      <div style={{ ...hint, border: '1px solid #5a4a1a', background: '#1c180c', padding: '0.8rem 1rem', color: '#d8c27a' }}>
        These details are printed on every quote, agreement, policy and receipt. The documents are standard South African freelance templates written as a
        careful starting point. <strong>Have an attorney review them before your first real client signs</strong>, especially the cancellation and refund
        terms, because consumer law can apply to individual clients.
      </div>

      <AdminLabel>Who you are</AdminLabel>
      <AdminGrid>
        <AdminField label="Full legal name (as on your ID)" value={form.legalName} onChange={set('legalName')} />
        <AdminField label="Trading name (optional)" value={form.tradingName} onChange={set('tradingName')} placeholder="e.g. Waterwitch Web Studio" />
        <AdminField label="ID or registration number" value={form.idOrRegNumber} onChange={set('idOrRegNumber')} />
        <AdminField label="Phone" value={form.phone} onChange={set('phone')} />
        <AdminField label="Business email" value={form.email} onChange={set('email')} />
        <AdminField label="Street address" value={form.address} onChange={set('address')} />
        <AdminField label="Town / city" value={form.city} onChange={set('city')} />
        <AdminField label="Province (decides which courts apply)" value={form.province} onChange={set('province')} placeholder="Northern Cape" />
        <AdminToggle label="I am registered for VAT" checked={form.vatRegistered} onChange={(v) => setForm((f) => ({ ...f, vatRegistered: v }))} hint="Most freelancers earning under R1 million a year are not." />
        {form.vatRegistered && <AdminField label="VAT number" value={form.vatNumber} onChange={set('vatNumber')} />}
      </AdminGrid>

      <AdminLabel>Privacy (POPIA)</AdminLabel>
      <p style={hint}>Every business that handles personal information needs an Information Officer. For a sole proprietor this is you.</p>
      <AdminGrid>
        <AdminField label="Information Officer name" value={form.informationOfficerName} onChange={set('informationOfficerName')} />
        <AdminField label="Information Officer email" value={form.informationOfficerEmail} onChange={set('informationOfficerEmail')} />
      </AdminGrid>

      <AdminLabel>Bank account for EFT payments (optional)</AdminLabel>
      <AdminGrid>
        <AdminField label="Bank" value={form.bankName} onChange={set('bankName')} />
        <AdminField label="Account holder" value={form.accountHolder} onChange={set('accountHolder')} />
        <AdminField label="Account number" value={form.accountNumber} onChange={set('accountNumber')} />
        <AdminField label="Branch code" value={form.branchCode} onChange={set('branchCode')} />
        <AdminField label="Account type" value={form.accountType} onChange={set('accountType')} placeholder="Cheque / Savings" />
      </AdminGrid>

      {error && <div role="alert" style={{ ...mono, fontSize: '0.74rem', color: 'hsl(348,100%,62%)', margin: '0.5rem 0 1rem' }}>{error}</div>}
      <SaveButton onSave={save} label="Save business details" />

      <AdminLabel>Payments &amp; email status</AdminLabel>
      <div style={{ marginBottom: '1rem' }}>
        {chip(!!status?.payfastConfigured, status?.payfastConfigured ? `PayFast keys set (${status.payfastMode})` : 'PayFast keys missing')}
        {chip(!!status?.emailConfigured, status?.emailConfigured ? 'Email key set' : 'Email key missing')}
      </div>
      <p style={hint}>Emails currently go out from: <strong style={{ color: '#ddd' }}>{status?.emailFrom}</strong>. Until you verify a domain in Resend, emails to clients will not be delivered, but clients can always download their documents inside the portal.</p>
      <button type="button" style={btn} disabled={checking} onClick={testPayfast}>{checking ? 'Testing...' : 'Test PayFast connection'}</button>
      {check && (
        <div role="status" style={{ ...mono, fontSize: '0.74rem', lineHeight: 1.6, marginTop: '0.8rem', color: check.ok ? '#6fcf73' : '#ff8aa0' }}>
          {check.ok ? '✓ ' : '✕ '}{check.message}
        </div>
      )}
    </div>
  );
}

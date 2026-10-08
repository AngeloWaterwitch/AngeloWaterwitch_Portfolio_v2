'use client';

import { useState } from 'react';
import { AdminLabel } from './AdminLabel';
import { AdminField } from './AdminField';
import { AdminGrid } from './AdminGrid';
import { AdminToggle } from './AdminToggle';
import { SaveButton } from './SaveButton';
import { DEFAULT_HEADINGS, HEADING_SECTION_IDS, type SiteSettingsData } from '@/lib/siteSettings';

const smallBtn: React.CSSProperties = {
  padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid #333', color: '#bbb',
  fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase',
  cursor: 'pointer', borderRadius: '1px',
};

const hint: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#888', lineHeight: 1.6, marginBottom: '1rem',
};

const SECTION_NAMES: Record<string, string> = {
  about: 'About', skills: 'Skills', projects: 'Projects', services: 'Services',
  timeline: 'Timeline', testimonials: 'Testimonials', contact: 'Contact',
};

export function HeaderFooterTab({ data, onRefetch }: any) {
  const base: SiteSettingsData = data.settings;
  const [form, setForm] = useState<SiteSettingsData>({
    ...base,
    legalLinks: base.legalLinks || [],
    sectionHeadings: base.sectionHeadings || {},
  });
  const [error, setError] = useState('');

  const set = <K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const headingOf = (id: string) => form.sectionHeadings[id] ?? DEFAULT_HEADINGS[id];
  const setHeading = (id: string, field: 'eyebrow' | 'lead' | 'highlight', value: string) =>
    set('sectionHeadings', { ...form.sectionHeadings, [id]: { ...headingOf(id), [field]: value } });
  const resetHeading = (id: string) => {
    const next = { ...form.sectionHeadings };
    delete next[id];
    set('sectionHeadings', next);
  };

  const setLink = (i: number, patch: Partial<{ label: string; url: string }>) =>
    set('legalLinks', form.legalLinks.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const save = async () => {
    setError('');

    // Only store headings that differ from the built-in text.
    const changed: SiteSettingsData['sectionHeadings'] = {};
    for (const id of HEADING_SECTION_IDS) {
      const h = form.sectionHeadings[id];
      const d = DEFAULT_HEADINGS[id];
      if (h && (h.eyebrow !== d.eyebrow || h.lead !== d.lead || h.highlight !== d.highlight)) changed[id] = h;
    }

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sectionHeadings: changed }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Could not save. Check the fields and try again.');
      throw new Error('save failed');
    }
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Header</AdminLabel>
      <p style={hint}>
        The header shows your logo (set in Branding) and the section links (set in Sections &amp; Nav).
        You can add one call-to-action button, for example &ldquo;Hire me&rdquo; linking to <code>#contact</code>.
      </p>
      <AdminGrid>
        <AdminField label="Button text (leave empty for no button)" value={form.navCtaLabel} onChange={v => set('navCtaLabel', v)} placeholder="Hire me" />
        <AdminField label="Button link" value={form.navCtaUrl} onChange={v => set('navCtaUrl', v)} placeholder="#contact" />
        <AdminToggle
          label="Show an “Admin” link in the public header"
          hint="Off by default. You can always sign in at /admin/login."
          checked={form.showAdminLink}
          onChange={v => set('showAdminLink', v)}
        />
      </AdminGrid>

      <AdminLabel>Footer</AdminLabel>
      <AdminGrid>
        <AdminField label="Short description under the logo" value={form.footerTagline} onChange={v => set('footerTagline', v)} textarea fullWidth />
        <AdminField label="Copyright name (shown after © year)" value={form.footerCopyright} onChange={v => set('footerCopyright', v)} />
        <AdminField label="Credit line" value={form.footerCredit} onChange={v => set('footerCredit', v)} />
        <AdminToggle label="Show the credit line" checked={form.showFooterCredit} onChange={v => set('showFooterCredit', v)} />
      </AdminGrid>
      <p style={hint}>
        Email, phone, location and social links in the footer come from the <strong>Contact</strong> tab. Social links with no address are hidden automatically.
      </p>

      <AdminLabel>Legal links (footer)</AdminLabel>
      <p style={hint}>
        For example Privacy Policy and Terms. Links must start with <code>https://</code>, <code>mailto:</code>, <code>tel:</code>, <code>#</code> or <code>/</code>. Up to 8.
      </p>
      {form.legalLinks.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.8rem', alignItems: 'end', marginBottom: '0.8rem' }}>
          <AdminField label="Name" value={l.label} onChange={v => setLink(i, { label: v })} placeholder="Privacy Policy" />
          <AdminField label="Link" value={l.url} onChange={v => setLink(i, { url: v })} placeholder="/privacy-policy" />
          <button type="button" style={smallBtn} onClick={() => set('legalLinks', form.legalLinks.filter((_, idx) => idx !== i))}>Remove</button>
        </div>
      ))}
      {form.legalLinks.length < 8 && (
        <button type="button" style={{ ...smallBtn, marginBottom: '1rem' }} onClick={() => set('legalLinks', [...form.legalLinks, { label: '', url: '' }])}>
          + Add link
        </button>
      )}

      <AdminLabel>Section headings</AdminLabel>
      <p style={hint}>
        Each section title has a small line above it, then a title where the last word is highlighted in colour.
        Example: <em>Say Hello</em> / <em>Get In</em> <strong style={{ color: 'hsl(348,100%,60%)' }}>Touch</strong>.
      </p>
      {HEADING_SECTION_IDS.map(id => {
        const h = headingOf(id);
        const isDefault = !form.sectionHeadings[id];
        return (
          <div key={id} style={{ background: '#141414', border: '1px solid #222', padding: '0.9rem 1rem', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#f0ede8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{SECTION_NAMES[id]}</span>
              {!isDefault && <button type="button" style={smallBtn} onClick={() => resetHeading(id)}>Reset to original</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
              <AdminField label="Small line above" value={h.eyebrow} onChange={v => setHeading(id, 'eyebrow', v)} />
              <AdminField label="Title" value={h.lead} onChange={v => setHeading(id, 'lead', v)} />
              <AdminField label="Highlighted word" value={h.highlight} onChange={v => setHeading(id, 'highlight', v)} />
            </div>
          </div>
        );
      })}

      {error && <div role="alert" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: 'hsl(348,100%,60%)', margin: '1rem 0' }}>{error}</div>}
      <div style={{ marginTop: '1.5rem' }}>
        <SaveButton onSave={save} label="Save header & footer" />
      </div>
    </div>
  );
}

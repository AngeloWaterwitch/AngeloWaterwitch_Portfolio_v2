'use client';

import { useState } from 'react';
import { AdminLabel } from './AdminLabel';
import { SaveButton } from './SaveButton';

type Row = { sectionId: string; label: string; visible: boolean; order: number };

const iconBtn = (disabled: boolean): React.CSSProperties => ({
  width: '2rem', height: '2rem', background: '#111', border: '1px solid #2a2a2a', color: disabled ? '#444' : '#f0ede8',
  cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: '1px', fontSize: '0.9rem', lineHeight: 1,
});

export function SectionsTab({ data, onRefetch }: any) {
  const initial: Row[] = [...(data.sections || [])].sort((a: Row, b: Row) => a.order - b.order);
  const [rows, setRows] = useState<Row[]>(initial);
  const [error, setError] = useState('');

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const update = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setError('');
    const payload = rows.map((r, idx) => ({ sectionId: r.sectionId, label: r.label.trim(), visible: r.visible, order: idx }));
    if (payload.some(p => !p.label)) {
      setError('Every section needs a name.');
      throw new Error('validation');
    }
    const res = await fetch('/api/sections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Could not save. Please try again.');
      throw new Error('save failed');
    }
    onRefetch();
  };

  return (
    <div>
      <AdminLabel>Sections &amp; Navigation</AdminLabel>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#888', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        This controls the order of the sections on the page, and the links in the header and footer. Use the arrows to reorder,
        edit a name to change its menu label, and untick Visible to hide a section everywhere.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {rows.map((r, i) => (
          <div key={r.sectionId} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: '0.8rem',
            background: '#141414', border: '1px solid #222', padding: '0.6rem 0.8rem', opacity: r.visible ? 1 : 0.55,
          }}>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button type="button" aria-label={`Move ${r.label} up`} disabled={i === 0} onClick={() => move(i, -1)} style={iconBtn(i === 0)}>↑</button>
              <button type="button" aria-label={`Move ${r.label} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} style={iconBtn(i === rows.length - 1)}>↓</button>
            </div>
            <div>
              <input
                value={r.label}
                maxLength={40}
                aria-label={`Menu name for ${r.sectionId}`}
                onChange={e => update(i, { label: e.target.value })}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', color: '#f0ede8', padding: '0.5rem 0.7rem', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', borderRadius: '1px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#666' }}>#{r.sectionId}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#bbb', cursor: 'pointer' }}>
              <input type="checkbox" checked={r.visible} onChange={e => update(i, { visible: e.target.checked })} style={{ accentColor: 'hsl(348,100%,45%)' }} />
              Visible
            </label>
          </div>
        ))}
      </div>

      {error && <div role="alert" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: 'hsl(348,100%,60%)', marginBottom: '1rem' }}>{error}</div>}
      <SaveButton onSave={save} label="Save order & names" />
    </div>
  );
}


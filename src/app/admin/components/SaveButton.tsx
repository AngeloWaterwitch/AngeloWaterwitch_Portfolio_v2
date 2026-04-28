'use client';

import { useState } from 'react';

interface SaveButtonProps {
  onSave: () => Promise<void>;
  label?: string;
}

export function SaveButton({ onSave, label = 'Save Changes' }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      style={{
        padding: '0.6rem 1.5rem',
        background: saved ? '#4caf50' : saving ? '#333' : 'hsl(348,100%,40%)',
        color: '#fff',
        border: 'none',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.72rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderRadius: '1px',
        cursor: saving ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {saved ? '✓ Saved!' : saving ? 'Saving...' : label}
    </button>
  );
}
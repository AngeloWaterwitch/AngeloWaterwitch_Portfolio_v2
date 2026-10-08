'use client';

interface AdminToggleProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  hint?: string;
}

export function AdminToggle({ label, checked, onChange, hint }: AdminToggleProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', cursor: 'pointer', gridColumn: '1 / -1' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: '0.2rem', accentColor: 'hsl(348,100%,45%)', width: '1rem', height: '1rem', flexShrink: 0 }}
      />
      <span>
        <span style={{ display: 'block', fontFamily: "'Syne', sans-serif", fontSize: '0.85rem', color: '#f0ede8' }}>{label}</span>
        {hint && (
          <span style={{ display: 'block', fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#777', marginTop: '0.2rem', lineHeight: 1.5 }}>
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

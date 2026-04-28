'use client';

interface AdminFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  textarea?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
}

export function AdminField({
  label,
  value,
  onChange,
  textarea,
  fullWidth,
  placeholder,
}: AdminFieldProps) {
  const baseStyle = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #222',
    color: '#f0ede8',
    padding: '0.6rem 0.8rem',
    fontFamily: "'Syne', sans-serif",
    fontSize: '0.85rem',
    borderRadius: '1px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.68rem',
        color: '#666',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        marginBottom: '0.4rem',
      }}>
        {label}
      </div>
      {textarea ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...baseStyle, resize: 'vertical' as const, minHeight: '80px' }}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={baseStyle}
        />
      )}
    </div>
  );
}
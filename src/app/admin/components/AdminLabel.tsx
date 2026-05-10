export function AdminLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.75rem',
      color: '#f0ede8',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      marginTop: '2.5rem',
      marginBottom: '1rem',
      paddingBottom: '0.6rem',
      borderBottom: '1px solid #222',
      fontWeight: 700,
    }}>
      {children}
    </div>
  );
}
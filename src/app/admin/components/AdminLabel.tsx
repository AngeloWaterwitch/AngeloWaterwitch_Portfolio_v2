export function AdminLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.72rem',
      color: 'hsl(348,100%,55%)',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      marginTop: '2.5rem',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #1a1a1a',
    }}>
      {children}
    </div>
  );
}
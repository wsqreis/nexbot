export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: '#64748b' }}>{subtitle}</p>}
    </div>
  );
}

export function Card({ title, children, style }) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {title && <h2 style={cardTitle}>{title}</h2>}
      {children}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const cardStyle = {
  background: 'white',
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  padding: '22px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.04)',
};

const cardTitle = { fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 };


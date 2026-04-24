import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Name is required');
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGrid} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <span style={styles.logoText}>NexBot</span>
        </div>

        <h1 style={styles.title}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={styles.subtitle}>
          {mode === 'login'
            ? 'Sign in to your dashboard'
            : 'Start managing your chatbot'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Wesley Reis"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? (
              <span style={styles.spinner} />
            ) : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={styles.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={styles.switchBtn}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>

        {mode === 'login' && (
          <button
            style={{ ...styles.switchBtn, marginTop: 8, fontSize: 12 }}
            onClick={() => { setEmail('demo@nexbot.io'); setPassword('demo1234'); }}
          >
            Use demo credentials
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(99,102,241,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.08) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 20,
    padding: '40px 36px',
    width: 400,
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 64px rgba(0,0,0,.4)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 38, height: 38, background: '#6366f1', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 6, letterSpacing: '-0.5px' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#94a3b8' },
  input: {
    background: '#0f172a', border: '1.5px solid #334155', borderRadius: 10,
    padding: '11px 14px', fontSize: 14, color: '#f1f5f9', outline: 'none',
    transition: 'border-color .15s',
  },
  error: {
    background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
    borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#f87171',
  },
  btn: {
    background: '#6366f1', border: 'none', borderRadius: 10, padding: '13px',
    fontSize: 15, fontWeight: 600, color: 'white', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4,
    transition: 'opacity .15s',
  },
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)',
    borderTop: '2px solid white', borderRadius: '50%',
    animation: 'spin .7s linear infinite',
    display: 'inline-block',
  },
  switchText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 20 },
  switchBtn: {
    background: 'none', border: 'none', color: '#818cf8',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'block', margin: '0 auto',
  },
};

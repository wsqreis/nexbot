import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ChatbotConfig from './ChatbotConfig';
import GTMPanel from './GTMPanel';
import RegionsPanel from './RegionsPanel';
import DeployPanel from './DeployPanel';
import LivePreview from './LivePreview';

const MENU = [
  { id: 'config',   label: 'Chatbot Config', icon: '⚙️' },
  { id: 'gtm',      label: 'GTM & Tracking', icon: '📊' },
  { id: 'regions',  label: 'Regions',         icon: '🌍' },
  { id: 'deploy',   label: 'Deploy',          icon: '🚀' },
  { id: 'preview',  label: 'Live Preview',    icon: '👁️' },
];

export default function Dashboard() {
  const [active, setActive] = useState('config');
  const { user, logout }    = useAuth();

  const panels = {
    config:  <ChatbotConfig />,
    gtm:     <GTMPanel />,
    regions: <RegionsPanel />,
    deploy:  <DeployPanel />,
    preview: <LivePreview />,
  };

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <span style={styles.logoText}>NexBot</span>
        </div>

        <nav style={styles.nav}>
          {MENU.map(item => (
            <button
              key={item.id}
              style={{ ...styles.navItem, ...(active === item.id ? styles.navItemActive : {}) }}
              onClick={() => setActive(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.userSection}>
          <div style={styles.userAvatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>{user?.role}</div>
          </div>
          <button onClick={logout} style={styles.logoutBtn} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.content}>
          {panels[active]}
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: { display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  sidebar: {
    width: 230, background: '#0f172a', display: 'flex', flexDirection: 'column',
    padding: '20px 12px', borderRight: '1px solid #1e293b', flexShrink: 0,
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px', marginBottom: 28 },
  logoIcon: { width: 32, height: 32, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText: { fontSize: 17, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer',
    color: '#64748b', fontSize: 13.5, fontWeight: 500, textAlign: 'left', width: '100%',
    transition: 'background .15s, color .15s',
  },
  navItemActive: { background: '#1e293b', color: '#e2e8f0' },
  navIcon: { fontSize: 16 },
  userSection: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 10px', borderTop: '1px solid #1e293b', marginTop: 8 },
  userAvatar: {
    width: 32, height: 32, background: '#6366f1', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: '#475569', textTransform: 'capitalize' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' },
  main: { flex: 1, overflow: 'auto' },
  content: { padding: '32px 36px', maxWidth: 900 },
};

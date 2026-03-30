import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { getSystemHealth } from './services/api.js';

export default function App() {
  const [view,   setView]   = useState('chat');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const h = await getSystemHealth();
        setHealth(h);
      } catch {}
    };
    loadHealth();
    const id = setInterval(loadHealth, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={styles.app}>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🧠</div>
          <div>
            <p style={styles.logoName}>OpsMind AI</p>
            <p style={styles.logoVer}>v1.0.0 — Week 4</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: 'chat',  icon: '💬', label: 'Chat' },
            { id: 'admin', icon: '📁', label: 'Knowledge Base' },
          ].map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(view === item.id ? styles.navActive : {}) }}
              onClick={() => setView(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* System health */}
        {health && (
          <div style={styles.healthCard}>
            <p style={styles.healthTitle}>System</p>
            <div style={styles.healthRow}>
              <span style={styles.healthLabel}>DB</span>
              <span style={{
                ...styles.healthVal,
                color: health.db === 'connected' ? '#4ade80' : '#f87171',
              }}>
                {health.db === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div style={styles.healthRow}>
              <span style={styles.healthLabel}>Memory</span>
              <span style={styles.healthVal}>{health.memory}</span>
            </div>
            <div style={styles.healthRow}>
              <span style={styles.healthLabel}>Uptime</span>
              <span style={styles.healthVal}>{health.uptime}</span>
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <div style={styles.footerDot} />
          <span style={styles.footerText}>RAG Pipeline Active</span>
        </div>
      </div>

      {/* Main */}
      <main style={styles.main}>
        {view === 'chat'  && <ChatWindow />}
        {view === 'admin' && <AdminPanel />}
      </main>

    </div>
  );
}

const styles = {
  app:         { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0d1117' },
  sidebar:     { width: '210px', flexShrink: 0, background: '#161b27', borderRight: '1px solid #21293d', display: 'flex', flexDirection: 'column', padding: '18px 12px' },
  logo:        { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '4px' },
  logoIcon:    { width: '34px', height: '34px', background: '#1e1b4b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', border: '1px solid #3730a3', flexShrink: 0 },
  logoName:    { fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 },
  logoVer:     { fontSize: '10px', color: '#334155', margin: 0 },
  nav:         { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 },
  navBtn:      { display: 'flex', alignItems: 'center', gap: '9px', background: 'transparent', border: 'none', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '500', padding: '9px 10px', textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'all 0.15s' },
  navActive:   { background: '#1e1b4b', color: '#a5b4fc', border: '1px solid #3730a3' },
  navIcon:     { fontSize: '15px' },
  healthCard:  { background: '#0d1117', border: '1px solid #21293d', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' },
  healthTitle: { fontSize: '10px', fontWeight: '600', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' },
  healthRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  healthLabel: { fontSize: '11px', color: '#475569' },
  healthVal:   { fontSize: '11px', color: '#94a3b8', fontWeight: '500' },
  footer:      { display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 4px 0', borderTop: '1px solid #21293d' },
  footerDot:   { width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' },
  footerText:  { fontSize: '11px', color: '#334155' },
  main:        { flex: 1, overflow: 'hidden', display: 'flex' },
};
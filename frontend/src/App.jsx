import { useState } from 'react';
import ChatWindow  from './components/ChatWindow.jsx';
import AdminPanel  from './components/AdminPanel.jsx';

export default function App() {
  const [view, setView] = useState('chat');

  return (
    <div style={styles.app}>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🧠</div>
          <div>
            <p style={styles.logoName}>OpsMind AI</p>
            <p style={styles.logoVersion}>v0.3.0 — Week 3</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navBtn,
              ...(view === 'chat' ? styles.navBtnActive : {}),
            }}
            onClick={() => setView('chat')}
          >
            <span style={styles.navIcon}>💬</span>
            Chat
          </button>
          <button
            style={{
              ...styles.navBtn,
              ...(view === 'admin' ? styles.navBtnActive : {}),
            }}
            onClick={() => setView('admin')}
          >
            <span style={styles.navIcon}>📁</span>
            Knowledge Base
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <p style={styles.footerText}>RAG Pipeline Active</p>
          <div style={styles.footerDot} />
        </div>
      </div>

      {/* Main content */}
      <main style={styles.main}>
        {view === 'chat'  && <ChatWindow />}
        {view === 'admin' && <AdminPanel />}
      </main>

    </div>
  );
}

const styles = {
  app: {
    display:  'flex',
    height:   '100vh',
    width:    '100vw',
    overflow: 'hidden',
    background: '#0f1117',
  },
  sidebar: {
    width:         '220px',
    flexShrink:    0,
    background:    '#1a1d27',
    borderRight:   '1px solid #2d3452',
    display:       'flex',
    flexDirection: 'column',
    padding:       '20px 12px',
  },
  logo: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    marginBottom: '28px',
    paddingLeft:  '4px',
  },
  logoIcon: {
    width:          '36px',
    height:         '36px',
    background:     '#312e81',
    borderRadius:   '8px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '18px',
    border:         '1px solid #4f46e5',
    flexShrink:     0,
  },
  logoName: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#f1f5f9',
  },
  logoVersion: {
    fontSize: '11px',
    color:    '#475569',
  },
  nav: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    flex:          1,
  },
  navBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    background:   'transparent',
    border:       'none',
    borderRadius: '8px',
    color:        '#64748b',
    fontSize:     '14px',
    fontWeight:   '500',
    padding:      '10px 12px',
    textAlign:    'left',
    width:        '100%',
    transition:   'all 0.15s ease',
  },
  navBtnActive: {
    background: '#312e81',
    color:      '#a5b4fc',
    border:     '1px solid #4f46e5',
  },
  navIcon: {
    fontSize: '16px',
  },
  sidebarFooter: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    padding:    '12px 4px 0',
    borderTop:  '1px solid #2d3452',
    marginTop:  '16px',
  },
  footerText: {
    fontSize: '11px',
    color:    '#334155',
  },
  footerDot: {
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
    background:   '#10b981',
    marginLeft:   'auto',
  },
  main: {
    flex:     1,
    overflow: 'hidden',
    display:  'flex',
  },
};
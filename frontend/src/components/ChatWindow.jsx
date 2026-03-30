import { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import MessageBubble from './MessageBubble.jsx';

const SUGGESTED = [
  'How do I process a refund?',
  'What do I do on my first day at work?',
  'How do I submit an expense claim?',
  'How many annual leave days do I get?',
  'What are the IT security password requirements?',
];

export default function ChatWindow() {
  const { messages, isLoading, error, latency, sendMessage, clearChat, stopStreaming } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const exportChat = () => {
    const text = messages
      .map(m => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `opsmind-chat-${Date.now()}.txt`;
    a.click();
  };

  const avgLatency = messages
    .filter(m => m.latencyMs)
    .reduce((acc, m, _, arr) => acc + m.latencyMs / arr.length, 0);

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>🧠</div>
          <div>
            <h2 style={styles.headerTitle}>OpsMind AI</h2>
            <p style={styles.headerSub}>SOP Knowledge Assistant · v1.0.0</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          {/* Latency badge */}
          {latency && (
            <span style={styles.latencyBadge}>
              ⚡ {(latency / 1000).toFixed(1)}s
            </span>
          )}
          {/* Avg latency */}
          {avgLatency > 0 && (
            <span style={styles.avgBadge}>
              avg {(avgLatency / 1000).toFixed(1)}s
            </span>
          )}
          {/* Status dot */}
          <div style={{ ...styles.dot, background: isLoading ? '#f59e0b' : '#10b981' }} />
          <span style={styles.statusText}>{isLoading ? 'Thinking...' : 'Ready'}</span>

          {messages.length > 0 && (
            <>
              <button onClick={exportChat} style={styles.headerBtn} title="Export chat">
                ⬇ Export
              </button>
              <button onClick={clearChat} style={styles.headerBtn} title="Clear chat">
                ✕ Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🧠</div>
            <h3 style={styles.emptyTitle}>Ask anything about your SOPs</h3>
            <p style={styles.emptySub}>
              Every answer is grounded in your uploaded documents and cited with the exact source.
            </p>
            <div style={styles.suggestions}>
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  style={styles.suggestBtn}
                  onClick={() => !isLoading && sendMessage(q)}
                >
                  <span style={styles.suggestArrow}>→</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}

        {error && (
          <div style={styles.errorBar}>⚠️ {error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputBox}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question about your SOPs... (Enter to send, Shift+Enter for new line)"
            style={styles.textarea}
            rows={1}
            disabled={isLoading}
          />
          <div style={styles.inputBtns}>
            {isLoading ? (
              <button onClick={stopStreaming} style={styles.stopBtn}>⏹ Stop</button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.35 }}
              >
                Send ↵
              </button>
            )}
          </div>
        </div>
        <div style={styles.inputFooter}>
          <span style={styles.hint}>
            {messages.length > 0
              ? `${Math.floor(messages.length / 2)} question${Math.floor(messages.length / 2) !== 1 ? 's' : ''} this session`
              : 'Answers are cited from your SOP documents'}
          </span>
          {messages.length > 0 && avgLatency > 0 && (
            <span style={styles.hint}>
              Avg response: {(avgLatency / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container:     { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117' },
  header:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#161b27', borderBottom: '1px solid #21293d', flexShrink: 0 },
  headerLeft:    { display: 'flex', alignItems: 'center', gap: '12px' },
  headerIcon:    { width: '38px', height: '38px', background: '#1e1b4b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #3730a3' },
  headerTitle:   { fontSize: '15px', fontWeight: '600', color: '#f1f5f9', margin: 0 },
  headerSub:     { fontSize: '11px', color: '#475569', margin: 0 },
  headerRight:   { display: 'flex', alignItems: 'center', gap: '8px' },
  latencyBadge:  { fontSize: '11px', color: '#4ade80', background: '#052e16', border: '1px solid #166534', borderRadius: '6px', padding: '2px 8px' },
  avgBadge:      { fontSize: '11px', color: '#94a3b8', background: '#1e293b', borderRadius: '6px', padding: '2px 8px' },
  dot:           { width: '7px', height: '7px', borderRadius: '50%', transition: 'background 0.3s' },
  statusText:    { fontSize: '12px', color: '#64748b' },
  headerBtn:     { background: 'transparent', border: '1px solid #21293d', borderRadius: '6px', color: '#64748b', fontSize: '12px', padding: '3px 10px', cursor: 'pointer' },
  messages:      { flex: 1, overflowY: 'auto', padding: '20px' },
  emptyState:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', textAlign: 'center', padding: '40px 20px' },
  emptyIcon:     { fontSize: '44px', marginBottom: '16px' },
  emptyTitle:    { fontSize: '18px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' },
  emptySub:      { fontSize: '13px', color: '#64748b', marginBottom: '28px', maxWidth: '380px', lineHeight: '1.6' },
  suggestions:   { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '460px' },
  suggestBtn:    { display: 'flex', alignItems: 'center', gap: '8px', background: '#161b27', border: '1px solid #21293d', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', padding: '10px 14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' },
  suggestArrow:  { color: '#6366f1', fontWeight: '600', flexShrink: 0 },
  errorBar:      { background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', padding: '10px 14px', margin: '8px 0' },
  inputArea:     { padding: '12px 20px 14px', background: '#161b27', borderTop: '1px solid #21293d', flexShrink: 0 },
  inputBox:      { display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#1e2435', border: '1px solid #2d3748', borderRadius: '12px', padding: '8px 10px 8px 14px', transition: 'border-color 0.15s' },
  textarea:      { flex: 1, background: 'transparent', color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5', resize: 'none', minHeight: '24px', maxHeight: '120px', fontFamily: 'inherit' },
  inputBtns:     { display: 'flex', alignItems: 'flex-end', gap: '6px', flexShrink: 0 },
  sendBtn:       { background: '#4338ca', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'all 0.15s' },
  stopBtn:       { background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
  inputFooter:   { display: 'flex', justifyContent: 'space-between', marginTop: '7px', padding: '0 2px' },
  hint:          { fontSize: '11px', color: '#334155' },
};
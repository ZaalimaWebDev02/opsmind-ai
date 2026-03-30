import { useState } from 'react';
import SourceCitation from './SourceCitation.jsx';

export default function MessageBubble({ message }) {
  const isUser  = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>

      {!isUser && <div style={styles.avatar}>🧠</div>}

      <div style={{ maxWidth: '78%' }}>
        <div style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
          ...(message.error ? styles.errorBubble : {}),
        }}>
          {/* Typing dots while empty and streaming */}
          {message.streaming && !message.content ? (
            <div style={styles.dots}>
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{ ...styles.dot, animationDelay: `${d}s` }} />
              ))}
            </div>
          ) : (
            <p style={styles.text}>
              {message.content}
              {message.streaming && <span style={styles.cursor}>▊</span>}
            </p>
          )}
        </div>

        {/* Sources */}
        {!isUser && !message.streaming && message.sources?.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}

        {/* Footer row: timestamp + latency + copy */}
        <div style={{ ...styles.footer, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <span style={styles.timestamp}>{formatTime(message.timestamp)}</span>

          {!isUser && message.latencyMs && (
            <span style={styles.latency}>⚡ {(message.latencyMs / 1000).toFixed(1)}s</span>
          )}

          {!isUser && !message.streaming && message.content && (
            <button onClick={copyText} style={styles.copyBtn}>
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
          )}
        </div>
      </div>

      {isUser && <div style={{ ...styles.avatar, ...styles.userAvatar }}>👤</div>}
    </div>
  );
}

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const styles = {
  wrapper:       { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' },
  avatar:        { width: '34px', height: '34px', borderRadius: '50%', background: '#1e2235', border: '1px solid #2d3452', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, marginTop: '2px' },
  userAvatar:    { background: '#1e1b4b', border: '1px solid #4338ca' },
  bubble:        { borderRadius: '14px', padding: '10px 14px', wordBreak: 'break-word' },
  userBubble:    { background: '#1e1b4b', border: '1px solid #4338ca', borderTopRightRadius: '4px' },
  assistantBubble: { background: '#1a1d2e', border: '1px solid #252a3d', borderTopLeftRadius: '4px' },
  errorBubble:   { background: '#1a0a0a', border: '1px solid #7f1d1d' },
  text:          { fontSize: '14px', lineHeight: '1.65', color: '#e2e8f0', whiteSpace: 'pre-wrap', margin: 0 },
  cursor:        { display: 'inline-block', color: '#818cf8', animation: 'pulse 1s ease infinite' },
  dots:          { display: 'flex', gap: '4px', padding: '6px 2px', alignItems: 'center' },
  dot:           { width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', animation: 'pulse 1.2s ease infinite' },
  footer:        { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', flexWrap: 'wrap' },
  timestamp:     { fontSize: '11px', color: '#334155' },
  latency:       { fontSize: '11px', color: '#4ade80', background: '#052e16', borderRadius: '4px', padding: '1px 6px' },
  copyBtn:       { fontSize: '11px', color: '#64748b', background: 'transparent', border: '1px solid #1e293b', borderRadius: '4px', padding: '1px 7px', cursor: 'pointer' },
};
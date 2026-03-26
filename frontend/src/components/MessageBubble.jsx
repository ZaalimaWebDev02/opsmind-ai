import SourceCitation from './SourceCitation.jsx';

/**
 * MessageBubble — renders a single chat message.
 * Handles user messages, streaming assistant messages, and error states.
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      ...styles.wrapper,
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={styles.avatar}>
          🧠
        </div>
      )}

      <div style={{ maxWidth: '75%' }}>
        {/* Bubble */}
        <div style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
          ...(message.error ? styles.errorBubble : {}),
        }}>
          {/* Streaming cursor */}
          {message.streaming && !message.content ? (
            <div style={styles.typingDots}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
              <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
            </div>
          ) : (
            <p style={styles.text}>
              {message.content}
              {message.streaming && (
                <span style={styles.cursor}>▊</span>
              )}
            </p>
          )}
        </div>

        {/* Sources — only on assistant messages */}
        {!isUser && !message.streaming && message.sources?.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}

        {/* Timestamp */}
        <p style={{
          ...styles.timestamp,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {formatTime(message.timestamp)}
        </p>
      </div>

      {/* User avatar */}
      {isUser && (
        <div style={{ ...styles.avatar, ...styles.userAvatar }}>
          👤
        </div>
      )}
    </div>
  );
}

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
  });
};

const styles = {
  wrapper: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '10px',
    marginBottom:'16px',
  },
  avatar: {
    width:          '34px',
    height:         '34px',
    borderRadius:   '50%',
    background:     '#21253a',
    border:         '1px solid #2d3452',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '16px',
    flexShrink:     0,
  },
  userAvatar: {
    background: '#312e81',
    border:     '1px solid #4f46e5',
  },
  bubble: {
    borderRadius: '12px',
    padding:      '10px 14px',
    wordBreak:    'break-word',
  },
  userBubble: {
    background:        '#312e81',
    border:            '1px solid #4f46e5',
    borderTopRightRadius: '4px',
  },
  assistantBubble: {
    background:       '#21253a',
    border:           '1px solid #2d3452',
    borderTopLeftRadius:'4px',
  },
  errorBubble: {
    background: '#2d1515',
    border:     '1px solid #ef4444',
  },
  text: {
    fontSize:   '14px',
    lineHeight: '1.6',
    color:      '#f1f5f9',
    whiteSpace: 'pre-wrap',
  },
  cursor: {
    display:   'inline-block',
    color:     '#6366f1',
    animation: 'pulse 1s ease infinite',
  },
  typingDots: {
    display: 'flex',
    gap:     '4px',
    padding: '4px 0',
  },
  dot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    background:   '#6366f1',
    animation:    'pulse 1.2s ease infinite',
  },
  timestamp: {
    fontSize:   '11px',
    color:      '#475569',
    marginTop:  '4px',
  },
};
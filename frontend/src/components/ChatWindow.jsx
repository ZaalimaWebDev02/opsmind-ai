import { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import MessageBubble from './MessageBubble.jsx';

const SUGGESTED_QUESTIONS = [
  'How do I process a refund?',
  'What do I do on my first day at work?',
  'How do I submit an expense claim?',
  'How many annual leave days do I get?',
  'What are the IT password requirements?',
];

/**
 * ChatWindow — main chat interface with streaming support.
 */
export default function ChatWindow() {
  const { messages, isLoading, error, sendMessage, clearChat, stopStreaming } = useChat();
  const [input,    setInput]    = useState('');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (q) => {
    if (isLoading) return;
    sendMessage(q);
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>🧠</div>
          <div>
            <h2 style={styles.headerTitle}>OpsMind AI</h2>
            <p style={styles.headerSub}>SOP Knowledge Assistant</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <div style={{
            ...styles.statusDot,
            background: isLoading ? '#f59e0b' : '#10b981',
          }} />
          <span style={styles.statusText}>
            {isLoading ? 'Thinking...' : 'Ready'}
          </span>
          {messages.length > 0 && (
            <button onClick={clearChat} style={styles.clearBtn} title="Clear chat">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div style={styles.messages}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🧠</div>
            <h3 style={styles.emptyTitle}>Ask anything about your SOPs</h3>
            <p style={styles.emptySub}>
              I will search the knowledge base and cite my exact sources.
            </p>
            <div style={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  style={styles.suggestionBtn}
                  onClick={() => handleSuggestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Error banner */}
        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        <div style={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your SOPs... (Enter to send)"
            style={styles.textarea}
            rows={1}
            disabled={isLoading}
          />
          <div style={styles.inputActions}>
            {isLoading ? (
              <button onClick={stopStreaming} style={styles.stopBtn}>
                ⏹ Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                style={{
                  ...styles.sendBtn,
                  opacity: input.trim() ? 1 : 0.4,
                }}
                disabled={!input.trim()}
              >
                Send ↵
              </button>
            )}
          </div>
        </div>
        <p style={styles.inputHint}>
          Answers are grounded in your SOP documents. Sources are always cited.
        </p>
      </div>

    </div>
  );
}

const styles = {
  container: {
    display:       'flex',
    flexDirection: 'column',
    height:        '100%',
    background:    '#0f1117',
  },
  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '14px 20px',
    background:     '#1a1d27',
    borderBottom:   '1px solid #2d3452',
    flexShrink:     0,
  },
  headerLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  headerIcon: {
    width:          '40px',
    height:         '40px',
    background:     '#312e81',
    borderRadius:   '10px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '20px',
    border:         '1px solid #4f46e5',
  },
  headerTitle: {
    fontSize:   '16px',
    fontWeight: '600',
    color:      '#f1f5f9',
  },
  headerSub: {
    fontSize: '12px',
    color:    '#64748b',
  },
  headerActions: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  statusDot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    transition:   'background 0.3s ease',
  },
  statusText: {
    fontSize: '12px',
    color:    '#64748b',
  },
  clearBtn: {
    background:   'transparent',
    border:       '1px solid #2d3452',
    borderRadius: '6px',
    color:        '#64748b',
    fontSize:     '12px',
    padding:      '4px 10px',
    marginLeft:   '8px',
  },
  messages: {
    flex:       1,
    overflowY:  'auto',
    padding:    '20px',
  },
  emptyState: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100%',
    minHeight:      '400px',
    textAlign:      'center',
    padding:        '40px 20px',
  },
  emptyIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize:     '20px',
    fontWeight:   '600',
    color:        '#f1f5f9',
    marginBottom: '8px',
  },
  emptySub: {
    fontSize:     '14px',
    color:        '#64748b',
    marginBottom: '28px',
    maxWidth:     '400px',
  },
  suggestions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    width:         '100%',
    maxWidth:      '480px',
  },
  suggestionBtn: {
    background:   '#1a1d27',
    border:       '1px solid #2d3452',
    borderRadius: '8px',
    color:        '#94a3b8',
    fontSize:     '13px',
    padding:      '10px 16px',
    textAlign:    'left',
    transition:   'all 0.15s ease',
  },
  errorBanner: {
    background:   '#2d1515',
    border:       '1px solid #ef4444',
    borderRadius: '8px',
    color:        '#fca5a5',
    fontSize:     '13px',
    padding:      '10px 14px',
    margin:       '8px 0',
  },
  inputArea: {
    padding:      '12px 20px 16px',
    background:   '#1a1d27',
    borderTop:    '1px solid #2d3452',
    flexShrink:   0,
  },
  inputWrapper: {
    display:      'flex',
    gap:          '10px',
    alignItems:   'flex-end',
    background:   '#21253a',
    border:       '1px solid #2d3452',
    borderRadius: '12px',
    padding:      '8px 10px 8px 14px',
  },
  textarea: {
    flex:       1,
    background: 'transparent',
    color:      '#f1f5f9',
    fontSize:   '14px',
    lineHeight: '1.5',
    resize:     'none',
    minHeight:  '24px',
    maxHeight:  '120px',
  },
  inputActions: {
    display:    'flex',
    alignItems: 'flex-end',
    gap:        '6px',
    flexShrink: 0,
  },
  sendBtn: {
    background:   '#4f46e5',
    color:        '#fff',
    borderRadius: '8px',
    padding:      '6px 14px',
    fontSize:     '13px',
    fontWeight:   '500',
    transition:   'all 0.15s ease',
  },
  stopBtn: {
    background:   '#7f1d1d',
    color:        '#fca5a5',
    borderRadius: '8px',
    padding:      '6px 14px',
    fontSize:     '13px',
    border:       '1px solid #ef4444',
  },
  inputHint: {
    fontSize:  '11px',
    color:     '#334155',
    marginTop: '8px',
    textAlign: 'center',
  },
};
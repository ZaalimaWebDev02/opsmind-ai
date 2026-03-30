import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../services/api';

const SESSION_KEY = 'opsmind_session_id';
const HISTORY_KEY = 'opsmind_messages';

const loadPersistedMessages = () => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistMessages = (msgs) => {
  try {
    // Only persist last 50 messages to avoid storage limits
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-50)));
  } catch {}
};

export const useChat = () => {
  const [messages,  setMessages]  = useState(() => loadPersistedMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);
  const [latency,   setLatency]   = useState(null);

  const sessionIdRef  = useRef(
    sessionStorage.getItem(SESSION_KEY) || uuidv4()
  );
  const controllerRef = useRef(null);

  // Persist session ID
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, sessionIdRef.current);
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  const sendMessage = useCallback((query) => {
    if (!query.trim() || isLoading) return;

    setError(null);
    setLatency(null);
    setIsLoading(true);

    const startTime = Date.now();

    const userMsg = {
      id:        uuidv4(),
      role:      'user',
      content:   query,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg = {
      id:        uuidv4(),
      role:      'assistant',
      content:   '',
      sources:   [],
      streaming: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    controllerRef.current = streamChat(
      query,
      sessionIdRef.current,

      (token) => {
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.content += token;
          updated[updated.length - 1] = last;
          return updated;
        });
      },

      (sources) => {
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.sources  = sources;
          updated[updated.length - 1] = last;
          return updated;
        });
      },

      (donePayload) => {
        const ms = donePayload?.totalMs || (Date.now() - startTime);
        setLatency(ms);
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.streaming = false;
          last.latencyMs = ms;
          updated[updated.length - 1] = last;
          return updated;
        });
        setIsLoading(false);
      },

      (err) => {
        setError(err.message);
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.streaming = false;
          last.error     = true;
          last.content   = last.content || 'Something went wrong. Please try again.';
          updated[updated.length - 1] = last;
          return updated;
        });
        setIsLoading(false);
      }
    );
  }, [isLoading]);

  const clearChat = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setLatency(null);
    sessionIdRef.current = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sessionIdRef.current);
    sessionStorage.removeItem(HISTORY_KEY);
  }, []);

  const stopStreaming = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        const last = { ...updated[updated.length - 1] };
        last.streaming = false;
        updated[updated.length - 1] = last;
      }
      return updated;
    });
    setIsLoading(false);
  }, []);

  return {
    messages,
    sessionId:    sessionIdRef.current,
    isLoading,
    error,
    latency,
    sendMessage,
    clearChat,
    stopStreaming,
  };
};
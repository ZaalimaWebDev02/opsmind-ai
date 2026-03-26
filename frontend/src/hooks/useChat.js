import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { streamChat } from '../services/api';

/**
 * useChat — manages all chat state and streaming logic.
 *
 * Returns: { messages, sessionId, isLoading, error, sendMessage, clearChat }
 */
export const useChat = () => {
  const [messages,  setMessages]  = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);

  // Persist session ID across renders (but reset on clearChat)
  const sessionIdRef  = useRef(uuidv4());
  const controllerRef = useRef(null);

  const sendMessage = useCallback((query) => {
    if (!query.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMsg = {
      id:        uuidv4(),
      role:      'user',
      content:   query,
      timestamp: new Date(),
    };

    // Add empty assistant message for streaming into
    const assistantMsg = {
      id:        uuidv4(),
      role:      'assistant',
      content:   '',
      sources:   [],
      streaming: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    // Start SSE stream
    controllerRef.current = streamChat(
      query,
      sessionIdRef.current,

      // onToken — append each token to last message
      (token) => {
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.content += token;
          updated[updated.length - 1] = last;
          return updated;
        });
      },

      // onSources — attach sources to last message
      (sources) => {
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.sources  = sources;
          updated[updated.length - 1] = last;
          return updated;
        });
      },

      // onDone — mark streaming complete
      () => {
        setMessages(prev => {
          const updated = [...prev];
          const last    = { ...updated[updated.length - 1] };
          last.streaming = false;
          updated[updated.length - 1] = last;
          return updated;
        });
        setIsLoading(false);
      },

      // onError
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
    sessionIdRef.current = uuidv4();
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
    sendMessage,
    clearChat,
    stopStreaming,
  };
};
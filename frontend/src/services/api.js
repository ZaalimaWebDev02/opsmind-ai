const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
const ADMIN_KEY = 'supersecretadminkey123';

// ── Chat ──────────────────────────────────────────────────────────────────────

export const streamChat = (query, sessionId, onToken, onSources, onDone, onError) => {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, sessionId }),
        signal:  controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Chat request failed');
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        let currentEvent = null;
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.replace('event:', '').trim();
          } else if (line.startsWith('data:') && currentEvent) {
            try {
              const payload = JSON.parse(line.replace('data:', '').trim());
              if (currentEvent === 'token')   onToken(payload.token);
              if (currentEvent === 'sources') onSources(payload.sources || []);
              if (currentEvent === 'done')    onDone(payload);
              if (currentEvent === 'error')   onError(new Error(payload.message));
            } catch (_) {}
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError(err);
    }
  })();

  return controller;
};

export const getChatHistory = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/chat/history/${sessionId}`);
  return res.json();
};

export const getChatSessions = async () => {
  const res = await fetch(`${BASE_URL}/chat/sessions`);
  return res.json();
};

export const deleteChatSession = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/chat/sessions/${sessionId}`, { method: 'DELETE' });
  return res.json();
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getDocuments = async () => {
  const res = await fetch(`${BASE_URL}/admin/documents`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
};

export const uploadPDF = async (file, onProgress) => {
  const form = new FormData();
  form.append('pdf', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText)?.error || 'Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.open('POST', `${BASE_URL}/upload`);
    xhr.setRequestHeader('x-admin-key', ADMIN_KEY);
    xhr.send(form);
  });
};

export const getDocumentStatus = async (docId) => {
  const res = await fetch(`${BASE_URL}/upload/status/${docId}`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
};

export const deleteDocument = async (docId) => {
  const res = await fetch(`${BASE_URL}/admin/documents/${docId}`, {
    method:  'DELETE',
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
};

export const getAdminHealth = async () => {
  const res = await fetch(`${BASE_URL}/admin/health`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
};

export const getSystemHealth = async () => {
  const res = await fetch(`/health`);
  return res.json();
};

export const clearCache = async () => {
  const res = await fetch(`${BASE_URL}/admin/cache/clear`, {
    method:  'POST',
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  return res.json();
};
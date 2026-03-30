import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getDocuments, uploadPDF, deleteDocument,
  getDocumentStatus, getAdminHealth, clearCache,
} from '../services/api.js';

export default function AdminPanel() {
  const [documents,      setDocuments]      = useState([]);
  const [health,         setHealth]         = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg,      setStatusMsg]      = useState('');
  const [statusType,     setStatusType]     = useState('info');
  const [loading,        setLoading]        = useState(true);
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, h] = await Promise.all([getDocuments(), getAdminHealth()]);
      setDocuments(docs.documents || []);
      setHealth(h);
    } catch (err) {
      showStatus('Failed to load: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData]);

  const showStatus = (msg, type = 'info') => {
    setStatusMsg(msg);
    setStatusType(type);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showStatus('Only PDF files allowed.', 'error'); return;
    }
    handleUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showStatus('Only PDF files allowed.', 'error'); return;
    }
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    stopPolling();
    setUploading(true);
    setUploadProgress(0);
    showStatus(`Uploading ${file.name}...`, 'info');

    try {
      const result = await uploadPDF(file, (pct) => setUploadProgress(pct));
      const docId  = result.docId;
      if (!docId) throw new Error('No docId returned');

      showStatus('Upload complete. Embedding in background...', 'info');

      pollRef.current = setInterval(async () => {
        try {
          const status = await getDocumentStatus(docId);
          if (status.status === 'ready') {
            stopPolling();
            setUploading(false);
            showStatus(`✅ "${file.name}" — ${status.totalChunks} chunks from ${status.totalPages} pages`, 'success');
            await loadData();
          } else if (status.status === 'error') {
            stopPolling();
            setUploading(false);
            showStatus(`❌ Failed: ${status.errorMessage}`, 'error');
            await loadData();
          } else {
            const n = status.totalChunks;
            showStatus(`Embedding${n ? ` (${n} chunks so far)` : ''}...`, 'info');
          }
        } catch (_) {}
      }, 4000);

    } catch (err) {
      stopPolling();
      setUploading(false);
      showStatus(`Upload failed: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.originalName}"?\nRemoves all ${doc.totalChunks} vectors.`)) return;
    try {
      await deleteDocument(doc._id);
      showStatus(`Deleted "${doc.originalName}"`, 'success');
      await loadData();
    } catch (err) {
      showStatus(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      showStatus('Query cache cleared', 'success');
    } catch (err) {
      showStatus('Cache clear failed: ' + err.message, 'error');
    }
  };

  const statusColors = { info: '#6366f1', success: '#10b981', error: '#ef4444' };
  const sc = statusColors[statusType];

  return (
    <div style={s.container}>

      <div style={s.header}>
        <div>
          <h2 style={s.title}>Knowledge Base</h2>
          <p style={s.sub}>Manage SOP documents · v1.0.0</p>
        </div>
        <div style={s.headerBtns}>
          <button onClick={handleClearCache} style={s.outlineBtn}>🗑 Clear Cache</button>
          <button onClick={loadData} disabled={loading} style={s.outlineBtn}>
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {health && (
        <div style={s.stats}>
          {[
            { v: health.readyDocs ?? 0,     l: 'Documents',  c: '#818cf8' },
            { v: health.totalVectors ?? 0,  l: 'Vectors',    c: '#34d399' },
            { v: health.processing ?? 0,    l: 'Processing', c: '#fbbf24' },
            { v: health.errored ?? 0,       l: 'Errors',     c: '#f87171' },
          ].map(({ v, l, c }) => (
            <div key={l} style={s.stat}>
              <p style={{ ...s.statVal, color: c }}>{v}</p>
              <p style={s.statLbl}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        style={{ ...s.dropZone, ...(uploading ? s.dropZoneActive : {}) }}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
        {uploading ? (
          <div style={s.uploadingState}>
            <div style={s.spinner} />
            <p style={s.dropText}>Processing...</p>
            <div style={s.bar}><div style={{ ...s.barFill, width: `${uploadProgress}%` }} /></div>
            <p style={s.barLabel}>{uploadProgress}% uploaded</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '28px', marginBottom: '6px' }}>📄</p>
            <p style={s.dropText}>Drop PDF here or click to upload</p>
            <p style={s.dropHint}>Max 50MB · Text-based PDFs only</p>
          </>
        )}
      </div>

      {/* Status */}
      {statusMsg && (
        <div style={{ ...s.statusBox, borderColor: sc, color: sc }}>
          {statusMsg}
        </div>
      )}

      {/* Table */}
      <div style={s.tableBox}>
        <p style={s.tableHdr}>Indexed Documents ({documents.length})</p>
        {loading ? (
          <div style={s.center}><div style={s.spinner} /><span style={s.muted}>Loading...</span></div>
        ) : documents.length === 0 ? (
          <div style={s.empty}>No documents yet. Upload a PDF to get started.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>{['File', 'Pages', 'Chunks', 'Status', 'Uploaded', 'Action'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc._id} style={s.tr}>
                  <td style={s.td}><span style={s.fname}>📄 {doc.originalName}</span></td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{doc.totalPages  || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{doc.totalChunks || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    <span style={{
                      ...s.badge,
                      background: doc.status === 'ready' ? '#052e16' : doc.status === 'processing' ? '#1c1917' : '#1a0808',
                      color:      doc.status === 'ready' ? '#4ade80' : doc.status === 'processing' ? '#fbbf24' : '#f87171',
                      border:     `1px solid ${doc.status === 'ready' ? '#166534' : doc.status === 'processing' ? '#92400e' : '#7f1d1d'}`,
                    }}>{doc.status}</span>
                  </td>
                  <td style={{ ...s.td, color: '#475569', fontSize: '12px' }}>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    <button onClick={() => handleDelete(doc)} style={s.delBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const s = {
  container:      { padding: '24px', maxWidth: '920px', margin: '0 auto', overflowY: 'auto', height: '100%' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title:          { fontSize: '20px', fontWeight: '600', color: '#f1f5f9', margin: 0 },
  sub:            { fontSize: '12px', color: '#475569', marginTop: '2px' },
  headerBtns:     { display: 'flex', gap: '8px' },
  outlineBtn:     { background: 'transparent', border: '1px solid #21293d', borderRadius: '8px', color: '#94a3b8', fontSize: '12px', padding: '6px 12px', cursor: 'pointer' },
  stats:          { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' },
  stat:           { background: '#161b27', border: '1px solid #21293d', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  statVal:        { fontSize: '22px', fontWeight: '700', margin: 0 },
  statLbl:        { fontSize: '11px', color: '#64748b', marginTop: '3px' },
  dropZone:       { border: '2px dashed #21293d', borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: '#161b27', marginBottom: '12px', minHeight: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  dropZoneActive: { borderColor: '#4338ca', cursor: 'default' },
  dropText:       { fontSize: '14px', color: '#94a3b8', fontWeight: '500', margin: '2px 0' },
  dropHint:       { fontSize: '12px', color: '#334155', marginTop: '4px' },
  uploadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' },
  spinner:        { width: '22px', height: '22px', border: '3px solid #21293d', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  bar:            { width: '55%', height: '4px', background: '#21293d', borderRadius: '2px', overflow: 'hidden' },
  barFill:        { height: '100%', background: '#6366f1', transition: 'width 0.3s' },
  barLabel:       { fontSize: '11px', color: '#475569' },
  statusBox:      { border: '1px solid', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px', background: '#0d1117' },
  tableBox:       { background: '#161b27', border: '1px solid #21293d', borderRadius: '12px', overflow: 'hidden' },
  tableHdr:       { fontSize: '13px', fontWeight: '600', color: '#475569', padding: '13px 16px', borderBottom: '1px solid #21293d' },
  table:          { width: '100%', borderCollapse: 'collapse' },
  th:             { fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '9px 14px', textAlign: 'left', background: '#0f1420' },
  tr:             { borderTop: '1px solid #1a2030' },
  td:             { padding: '11px 14px', color: '#94a3b8', fontSize: '13px' },
  fname:          { color: '#e2e8f0', display: 'flex', gap: '5px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge:          { display: 'inline-block', borderRadius: '20px', padding: '2px 9px', fontSize: '11px', fontWeight: '500' },
  delBtn:         { background: 'transparent', border: '1px solid #1a2030', borderRadius: '6px', color: '#ef4444', fontSize: '11px', padding: '3px 9px', cursor: 'pointer' },
  center:         { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px' },
  muted:          { color: '#64748b', fontSize: '13px' },
  empty:          { padding: '32px', textAlign: 'center', color: '#334155', fontSize: '13px' },
};
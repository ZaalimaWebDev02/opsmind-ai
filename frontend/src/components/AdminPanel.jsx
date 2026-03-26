import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getDocuments,
  uploadPDF,
  deleteDocument,
  getDocumentStatus,
  getAdminHealth,
} from '../services/api.js';

export default function AdminPanel() {
  const [documents,      setDocuments]      = useState([]);
  const [health,         setHealth]         = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus,   setUploadStatus]   = useState('');
  const [statusType,     setStatusType]     = useState('info');
  const [loading,        setLoading]        = useState(true);
  const fileRef    = useRef(null);
  const pollRef    = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, h] = await Promise.all([getDocuments(), getAdminHealth()]);
      setDocuments(docs.documents || docs || []); // 🔥 FIX: supports both formats
      setHealth(h);
    } catch (err) {
      showStatus('Failed to load: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  const showStatus = (msg, type = 'info') => {
    setUploadStatus(msg);
    setStatusType(type);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showStatus('Only PDF files are allowed.', 'error');
      return;
    }
    handleUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showStatus('Only PDF files are allowed.', 'error');
      return;
    }
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    stopPolling();
    setUploading(true);
    setUploadProgress(0);
    showStatus(`Uploading ${file.name}...`, 'info');

    let docId = null;

    try {
      const result = await uploadPDF(file, (pct) => setUploadProgress(pct));
      docId = result.docId;

      if (!docId) {
        throw new Error('No docId returned from server');
      }

      showStatus('Upload complete. Embedding in background...', 'info');

      pollRef.current = setInterval(async () => {
        try {
          const status = await getDocumentStatus(docId);

          console.log("STATUS RESPONSE:", status); // 🧪 debug

          // 🔥 FIX: handle multiple backend status values
          if (['ready', 'completed', 'done', 'indexed'].includes(status.status)) {
            stopPolling();
            setUploading(false);
            showStatus(
              `Done! "${file.name}" — ${status.totalChunks} chunks from ${status.totalPages} pages`,
              'success'
            );
            await loadData();

          } else if (status.status === 'error') {
            stopPolling();
            setUploading(false);
            showStatus(`Embedding failed: ${status.errorMessage || 'Unknown error'}`, 'error');
            await loadData();

          } else {
            const chunksText = status.totalChunks > 0
              ? ` (${status.totalChunks} chunks so far)`
              : '';
            showStatus(`Embedding in progress${chunksText}...`, 'info');
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr.message);
        }
      }, 4000);

    } catch (err) {
      stopPolling();
      setUploading(false);
      showStatus(`Upload failed: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.originalName}"?\nThis removes all ${doc.totalChunks} vectors from the index.`)) return;
    try {
      await deleteDocument(doc._id);
      showStatus(`Deleted "${doc.originalName}"`, 'success');
      await loadData();
    } catch (err) {
      showStatus(`Delete failed: ${err.message}`, 'error');
    }
  };

  const statusColor = { info: '#6366f1', success: '#10b981', error: '#ef4444' }[statusType];
  

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Knowledge Base</h2>
          <p style={styles.subtitle}>Manage SOP documents for OpsMind AI</p>
        </div>
        <button onClick={loadData} style={styles.refreshBtn} disabled={loading}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {/* Stats */}
      {health && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <p style={styles.statValue}>{health.readyDocs ?? documents.length}</p>
            <p style={styles.statLabel}>Documents</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statValue}>{health.totalVectors ?? 0}</p>
            <p style={styles.statLabel}>Vectors</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statValue, color: '#10b981' }}>Online</p>
            <p style={styles.statLabel}>Status</p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        style={{
          ...styles.dropZone,
          ...(uploading ? styles.dropZoneUploading : {}),
        }}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {uploading ? (
          <div style={styles.uploadingState}>
            <div style={styles.spinner} />
            <p style={styles.dropText}>Processing...</p>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
            </div>
            <p style={styles.progressLabel}>{uploadProgress}% uploaded</p>
          </div>
        ) : (
          <>
            <div style={styles.dropIcon}>📄</div>
            <p style={styles.dropText}>Drop a PDF here or click to upload</p>
            <p style={styles.dropHint}>Max 50MB · Text-based PDFs only</p>
          </>
        )}
      </div>

      {/* Status message */}
      {uploadStatus && (
        <div style={{ ...styles.statusMsg, borderColor: statusColor, color: statusColor }}>
          {statusType === 'success' && '✅ '}
          {statusType === 'error'   && '❌ '}
          {statusType === 'info'    && '⏳ '}
          {uploadStatus}
        </div>
      )}

      {/* Documents table */}
      <div style={styles.tableWrapper}>
        <p style={styles.tableTitle}>
          Indexed Documents ({documents.length})
        </p>

        {loading ? (
          <div style={styles.centerRow}>
            <div style={styles.spinner} />
            <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '10px' }}>
              Loading...
            </span>
          </div>
        ) : documents.length === 0 ? (
          <div style={styles.emptyRow}>
            No documents yet. Upload a PDF to get started.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['File Name', 'Pages', 'Chunks', 'Status', 'Uploaded', 'Action'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc._id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.fileName}>📄 {doc.originalName}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{doc.totalPages  || '—'}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{doc.totalChunks || '—'}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={{
                      ...styles.badge,
                      background: doc.status === 'ready'      ? '#052e16'
                                : doc.status === 'processing'  ? '#1c1917'
                                : '#2d1515',
                      color:      doc.status === 'ready'      ? '#4ade80'
                                : doc.status === 'processing'  ? '#f59e0b'
                                : '#f87171',
                      border: `1px solid ${
                                doc.status === 'ready'      ? '#16a34a'
                                : doc.status === 'processing' ? '#d97706'
                                : '#dc2626'}`,
                    }}>
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#64748b', fontSize: '12px' }}>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button onClick={() => handleDelete(doc)} style={styles.deleteBtn}>
                      Delete
                    </button>
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

const styles = {
  container:    { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title:        { fontSize: '20px', fontWeight: '600', color: '#f1f5f9' },
  subtitle:     { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  refreshBtn:   { background: 'transparent', border: '1px solid #2d3452', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', padding: '6px 14px', cursor: 'pointer' },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' },
  statCard:     { background: '#1a1d27', border: '1px solid #2d3452', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  statValue:    { fontSize: '24px', fontWeight: '700', color: '#818cf8' },
  statLabel:    { fontSize: '12px', color: '#64748b', marginTop: '4px' },
  dropZone:     { border: '2px dashed #2d3452', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#1a1d27', marginBottom: '12px', transition: 'all 0.15s ease', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  dropZoneUploading: { cursor: 'default', borderColor: '#4f46e5' },
  dropIcon:     { fontSize: '32px', marginBottom: '8px' },
  dropText:     { fontSize: '14px', color: '#94a3b8', fontWeight: '500' },
  dropHint:     { fontSize: '12px', color: '#475569', marginTop: '4px' },
  uploadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' },
  spinner:      { width: '24px', height: '24px', border: '3px solid #2d3452', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  progressBar:  { width: '60%', maxWidth: '240px', height: '4px', background: '#2d3452', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#6366f1', transition: 'width 0.3s ease' },
  progressLabel:{ fontSize: '12px', color: '#64748b' },
  statusMsg:    { border: '1px solid', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px', background: '#0f1117' },
  tableWrapper: { background: '#1a1d27', border: '1px solid #2d3452', borderRadius: '12px', overflow: 'hidden' },
  tableTitle:   { fontSize: '13px', fontWeight: '600', color: '#64748b', padding: '14px 16px', borderBottom: '1px solid #2d3452' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 16px', textAlign: 'left', background: '#161925' },
  tr:           { borderTop: '1px solid #2d3452' },
  td:           { padding: '12px 16px', color: '#94a3b8', fontSize: '13px' },
  fileName:     { color: '#f1f5f9', display: 'flex', gap: '6px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge:        { display: 'inline-block', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '500' },
  deleteBtn:    { background: 'transparent', border: '1px solid #2d3452', borderRadius: '6px', color: '#ef4444', fontSize: '12px', padding: '4px 10px', cursor: 'pointer' },
  centerRow:    { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  emptyRow:     { padding: '32px', textAlign: 'center', color: '#475569', fontSize: '13px' },
};
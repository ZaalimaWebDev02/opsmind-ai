import { useState } from 'react';

export default function SourceCitation({ sources }) {
  const [expanded, setExpanded] = useState(null);
  if (!sources || sources.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>Sources cited</p>
      <div style={styles.chips}>
        {sources.map((s, i) => (
          <div key={i} style={styles.sourceBlock}>
            <button
              style={{ ...styles.chip, ...(expanded === i ? styles.chipActive : {}) }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span style={styles.chipNum}>{i + 1}</span>
              <span style={styles.chipFile}>{s.fileName}</span>
              <span style={styles.chipPage}>Page {s.pageNumber}</span>
              {s.score != null && (
                <span style={{
                  ...styles.chipScore,
                  background: s.score > 0.85 ? '#052e16' : s.score > 0.7 ? '#1c2a1c' : '#1c1917',
                  color:      s.score > 0.85 ? '#4ade80' : s.score > 0.7 ? '#86efac' : '#f59e0b',
                }}>
                  {Math.round(s.score * 100)}%
                </span>
              )}
              <span style={styles.arrow}>{expanded === i ? '▲' : '▼'}</span>
            </button>

            {expanded === i && (
              <div style={styles.preview}>
                <div style={styles.previewHeader}>
                  <span style={styles.previewFile}>{s.fileName}</span>
                  <span style={styles.previewPage}>Page {s.pageNumber}</span>
                </div>
                <p style={styles.previewText}>
                  {s.preview || s.chunkText || 'No preview available'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper:      { marginTop: '10px' },
  label:        { fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' },
  chips:        { display: 'flex', flexDirection: 'column', gap: '4px' },
  sourceBlock:  { display: 'flex', flexDirection: 'column', gap: '4px' },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#161d2e', border: '1px solid #1e3a5f',
    borderRadius: '6px', padding: '5px 10px',
    color: '#93c5fd', fontSize: '12px', cursor: 'pointer',
    width: 'fit-content', transition: 'all 0.15s ease',
  },
  chipActive:   { background: '#1e2d4a', borderColor: '#3b82f6' },
  chipNum:      { background: '#1e3a5f', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#60a5fa', flexShrink: 0 },
  chipFile:     { fontWeight: '500', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chipPage:     { background: '#1e3a5f', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', color: '#93c5fd', flexShrink: 0 },
  chipScore:    { borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontWeight: '600', flexShrink: 0 },
  arrow:        { fontSize: '8px', color: '#475569', marginLeft: '2px' },
  preview:      { background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '10px 12px', animation: 'fadeIn 0.15s ease' },
  previewHeader:{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' },
  previewFile:  { fontSize: '11px', fontWeight: '600', color: '#60a5fa' },
  previewPage:  { fontSize: '11px', color: '#475569', background: '#1e3a5f', borderRadius: '4px', padding: '1px 6px' },
  previewText:  { fontSize: '12px', color: '#94a3b8', lineHeight: '1.65', fontStyle: 'italic' },
};
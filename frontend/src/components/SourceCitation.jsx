import { useState } from 'react';

/**
 * SourceCitation — renders clickable source chips under assistant messages.
 * Clicking a chip expands to show the full chunk text preview.
 */
export default function SourceCitation({ sources }) {
  const [expanded, setExpanded] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>Sources</p>
      <div style={styles.chips}>
        {sources.map((s, i) => (
          <div key={i}>
            <button
              style={{
                ...styles.chip,
                ...(expanded === i ? styles.chipActive : {}),
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
              title={s.preview}
            >
              <span style={styles.chipIcon}>📄</span>
              <span style={styles.chipText}>
                {s.fileName}
              </span>
              <span style={styles.chipPage}>p.{s.pageNumber}</span>
              {s.score && (
                <span style={styles.chipScore}>
                  {Math.round(s.score * 100)}%
                </span>
              )}
              <span style={styles.chevron}>
                {expanded === i ? '▲' : '▼'}
              </span>
            </button>

            {expanded === i && (
              <div style={styles.preview}>
                <p style={styles.previewMeta}>
                  {s.fileName} — Page {s.pageNumber}
                  {s.score && ` — Relevance: ${Math.round(s.score * 100)}%`}
                </p>
                <p style={styles.previewText}>
                  "{s.preview}{s.preview?.length >= 149 ? '...' : ''}"
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
  wrapper: {
    marginTop: '10px',
  },
  label: {
    fontSize:     '11px',
    fontWeight:   '600',
    color:        '#64748b',
    textTransform:'uppercase',
    letterSpacing:'0.05em',
    marginBottom: '6px',
  },
  chips: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       '6px',
    flexDirection: 'column',
  },
  chip: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '5px',
    background:     '#1e2d4a',
    border:         '1px solid #2563eb',
    borderRadius:   '6px',
    padding:        '4px 10px',
    color:          '#93c5fd',
    fontSize:       '12px',
    cursor:         'pointer',
    transition:     'all 0.15s ease',
    width:          'fit-content',
  },
  chipActive: {
    background: '#1e3a5f',
    borderColor:'#3b82f6',
    color:      '#bfdbfe',
  },
  chipIcon: {
    fontSize: '12px',
  },
  chipText: {
    fontWeight:  '500',
    maxWidth:    '200px',
    overflow:    'hidden',
    textOverflow:'ellipsis',
    whiteSpace:  'nowrap',
  },
  chipPage: {
    background:   '#2563eb22',
    borderRadius: '4px',
    padding:      '1px 5px',
    fontSize:     '11px',
    color:        '#60a5fa',
  },
  chipScore: {
    background:   '#10b98122',
    borderRadius: '4px',
    padding:      '1px 5px',
    fontSize:     '11px',
    color:        '#34d399',
  },
  chevron: {
    fontSize: '9px',
    color:    '#60a5fa',
  },
  preview: {
    background:   '#0f1d33',
    border:       '1px solid #1d4ed8',
    borderRadius: '8px',
    padding:      '10px 12px',
    marginTop:    '4px',
    animation:    'fadeIn 0.15s ease',
  },
  previewMeta: {
    fontSize:     '11px',
    color:        '#60a5fa',
    fontWeight:   '600',
    marginBottom: '6px',
  },
  previewText: {
    fontSize:   '12px',
    color:      '#94a3b8',
    lineHeight: '1.6',
    fontStyle:  'italic',
  },
};
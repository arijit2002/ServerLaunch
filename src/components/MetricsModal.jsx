import React, { useState, useEffect } from 'react';

const RANGES = [
  { label: '24h', hours: 24,  period: 3600  },
  { label: '6h',  hours: 6,   period: 900   },
  { label: '1h',  hours: 1,   period: 300   },
];

export default function MetricsModal({ instance, onClose }) {
  const { id, name, region } = instance;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [range,   setRange]   = useState(RANGES[0]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    window.serverLaunch.getMetrics({ instanceId: id, region, hours: range.hours, period: range.period })
      .then(res => {
        if (cancelled) return;
        if (res.success) setData(res);
        else setError(res.error);
        setLoading(false);
      })
      .catch(e => {
        if (!cancelled) { setError(e.message); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [id, region, range]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>CloudWatch Metrics</h3>
            <p style={styles.sub}>{name} · {id}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.rangeRow}>
              {RANGES.map(r => (
                <button
                  key={r.label}
                  style={{ ...styles.rangeBtn, ...(range === r ? styles.rangeBtnActive : {}) }}
                  onClick={() => setRange(r)}
                >{r.label}</button>
              ))}
            </div>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={styles.centered}>
            <span className="spinner" style={{ width: 28, height: 28 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Fetching metrics…</p>
          </div>
        ) : error ? (
          <div style={styles.centered}>
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>Failed: {error}</p>
          </div>
        ) : (
          <div style={styles.charts}>
            <Chart
              label="CPU Utilization"
              data={data.cpu}
              color="#3b82f6"
              unit="%"
              format={v => v.toFixed(1) + '%'}
            />
            <Chart
              label="Network In"
              data={data.netIn}
              color="#22c55e"
              unit="B"
              format={formatBytes}
            />
            <Chart
              label="Network Out"
              data={data.netOut}
              color="#f59e0b"
              unit="B"
              format={formatBytes}
            />
          </div>
        )}

        <p style={styles.footer}>
          Basic monitoring (5-min intervals). Enable detailed monitoring in AWS Console for 1-min data.
        </p>
      </div>
    </div>
  );
}

function Chart({ label, data, color, format }) {
  if (!data || data.length === 0) {
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartLabel}>{label}</p>
        <div style={styles.noData}>No data available for this period</div>
      </div>
    );
  }

  const W = 460, H = 110;
  const PAD = { top: 10, right: 10, bottom: 28, left: 48 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top  - PAD.bottom;

  const vals   = data.map(d => d.Average);
  const maxVal = Math.max(...vals, 0.001);
  const minVal = Math.min(...vals, 0);

  const xOf = i   => PAD.left + (data.length === 1 ? cw / 2 : (i / (data.length - 1)) * cw);
  const yOf = v   => PAD.top  + ch - ((v - minVal) / (maxVal - minVal || 1)) * ch;

  const pts    = data.map((d, i) => [xOf(i), yOf(d.Average)]);
  const linePt = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area   = `${linePt} L ${pts[pts.length - 1][0].toFixed(1)} ${(PAD.top + ch).toFixed(1)} L ${pts[0][0].toFixed(1)} ${(PAD.top + ch).toFixed(1)} Z`;

  const yLabels = [maxVal, minVal];

  const tFmt = ts => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  const xTicks = data.length <= 6 ? data : data.filter((_, i) => i % Math.ceil(data.length / 5) === 0);

  return (
    <div style={styles.chartWrap}>
      <div style={styles.chartHeader}>
        <p style={styles.chartLabel}>{label}</p>
        <p style={{ ...styles.chartLabel, color }}>{format(vals[vals.length - 1])} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>latest</span></p>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <clipPath id={`clip-${label}`}>
            <rect x={PAD.left} y={PAD.top} width={cw} height={ch} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            x1={PAD.left} y1={PAD.top + ch * (1 - f)}
            x2={PAD.left + cw} y2={PAD.top + ch * (1 - f)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}

        {/* Area + Line */}
        <g clipPath={`url(#clip-${label})`}>
          <path d={area} fill={`url(#g-${label})`} />
          <path d={linePt} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.length === 1 && (
            <circle cx={pts[0][0]} cy={pts[0][1]} r="3" fill={color} />
          )}
        </g>

        {/* Y labels */}
        {yLabels.map((v, i) => (
          <text key={i} x={PAD.left - 6} y={i === 0 ? PAD.top + 4 : PAD.top + ch} textAnchor="end" fontSize="9" fill="#64748b">
            {format(v)}
          </text>
        ))}

        {/* X labels */}
        {xTicks.map((d, i) => {
          const xi = data.indexOf(d);
          return (
            <text key={i} x={xOf(xi)} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b">
              {tFmt(d.Timestamp)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function formatBytes(b) {
  if (b === 0) return '0 B';
  if (b < 1024) return b.toFixed(0) + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
  return (b / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

const styles = {
  modal: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 24,
    maxWidth: 580,
    width: '94%',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' },
  sub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: 4,
  },
  rangeRow: { display: 'flex', gap: 4 },
  rangeBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
  },
  rangeBtnActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  charts: { display: 'flex', flexDirection: 'column', gap: 16 },
  chartWrap: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 16px 10px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chartLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  noData: {
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12.5,
    color: 'var(--text-muted)',
  },
  footer: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 16,
    lineHeight: 1.5,
    textAlign: 'center',
  },
};

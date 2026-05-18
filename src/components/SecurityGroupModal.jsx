import React, { useState, useEffect } from 'react';

export default function SecurityGroupModal({ instance, onClose }) {
  const { id, name, region } = instance;
  const [sgs,     setSgs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('inbound');
  const [openSg,  setOpenSg]  = useState(null);

  useEffect(() => {
    window.serverLaunch.getSecurityGroups({ instanceId: id, region })
      .then(res => {
        if (res.success) {
          setSgs(res.securityGroups);
          if (res.securityGroups.length > 0) setOpenSg(res.securityGroups[0].id);
        } else {
          setError(res.error);
        }
        setLoading(false);
      });
  }, [id, region]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Security Groups</h3>
            <p style={styles.sub}>{name} · {id}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={styles.centered}>
            <span className="spinner" style={{ width: 26, height: 26 }} />
          </div>
        ) : error ? (
          <div style={styles.centered}>
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>Failed: {error}</p>
          </div>
        ) : sgs.length === 0 ? (
          <div style={styles.centered}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No security groups found.</p>
          </div>
        ) : (
          <>
            {/* SG tabs */}
            {sgs.length > 1 && (
              <div style={styles.sgTabs}>
                {sgs.map(sg => (
                  <button
                    key={sg.id}
                    style={{ ...styles.sgTab, ...(openSg === sg.id ? styles.sgTabActive : {}) }}
                    onClick={() => setOpenSg(sg.id)}
                  >
                    {sg.name}
                    <span style={styles.sgId}>{sg.id}</span>
                  </button>
                ))}
              </div>
            )}

            {sgs.filter(sg => sg.id === openSg || sgs.length === 1).map(sg => (
              <div key={sg.id}>
                {sgs.length === 1 && (
                  <div style={styles.sgMeta}>
                    <span style={styles.sgName}>{sg.name}</span>
                    <span style={styles.sgIdBig}>{sg.id}</span>
                    {sg.description && <span style={styles.sgDesc}>{sg.description}</span>}
                  </div>
                )}

                {/* Direction tabs */}
                <div style={styles.dirTabs}>
                  {['inbound', 'outbound'].map(t => (
                    <button
                      key={t}
                      style={{ ...styles.dirTab, ...(tab === t ? styles.dirTabActive : {}) }}
                      onClick={() => setTab(t)}
                    >
                      {t === 'inbound' ? '↓ Inbound' : '↑ Outbound'}
                      <span style={styles.ruleCount}>
                        {(t === 'inbound' ? sg.inboundRules : sg.outboundRules).length}
                      </span>
                    </button>
                  ))}
                </div>

                <RulesTable rules={tab === 'inbound' ? sg.inboundRules : sg.outboundRules} direction={tab} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function RulesTable({ rules, direction }) {
  if (rules.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No {direction} rules.</p>;
  }
  const srcKey = direction === 'inbound' ? 'sources' : 'destinations';

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Protocol</th>
            <th style={styles.th}>Port range</th>
            <th style={styles.th}>{direction === 'inbound' ? 'Source' : 'Destination'}</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r, i) => (
            <tr key={i} style={i % 2 === 0 ? {} : styles.altRow}>
              <td style={styles.td}>
                <span style={{ ...styles.protoBadge, ...protoColor(r.protocol) }}>{r.protocol}</span>
              </td>
              <td style={styles.td}>
                {r.fromPort === null
                  ? <span style={{ color: 'var(--text-muted)' }}>All</span>
                  : r.fromPort === r.toPort
                    ? <code style={styles.portCode}>{r.fromPort}</code>
                    : <code style={styles.portCode}>{r.fromPort} – {r.toPort}</code>
                }
              </td>
              <td style={styles.td}>
                {(r[srcKey] || []).length === 0
                  ? <span style={{ color: 'var(--text-muted)' }}>—</span>
                  : (r[srcKey]).map((s, j) => (
                      <div key={j} style={styles.srcItem}>{s}</div>
                    ))
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function protoColor(proto) {
  if (proto === 'TCP')          return { background: 'rgba(59,130,246,0.15)',  color: '#60a5fa' };
  if (proto === 'UDP')          return { background: 'rgba(168,85,247,0.15)',  color: '#c084fc' };
  if (proto === 'ICMP')         return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
  if (proto === 'All traffic')  return { background: 'rgba(239,68,68,0.12)',   color: '#f87171' };
  return                               { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' };
}

const styles = {
  modal: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 24,
    maxWidth: 600,
    width: '94%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexShrink: 0,
  },
  title:   { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' },
  sub:     { fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' },
  closeBtn:{
    background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4,
  },
  centered: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0',
  },
  sgTabs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  sgTab: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-primary)',
    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
  },
  sgTabActive: { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' },
  sgId:   { fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 },
  sgMeta: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 },
  sgName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  sgIdBig:{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' },
  sgDesc: { fontSize: 12, color: 'var(--text-muted)' },
  dirTabs: { display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
  dirTab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', border: 'none', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    borderBottom: '2px solid transparent', marginBottom: -1,
  },
  dirTabActive: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },
  ruleCount: {
    background: 'var(--bg-tertiary)', borderRadius: 10,
    padding: '0 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
  },
  tableWrap: { overflow: 'auto', flex: 1 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12.5 },
  th: {
    textAlign: 'left', padding: '7px 12px',
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)',
  },
  td:     { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top' },
  altRow: { background: 'rgba(255,255,255,0.015)' },
  protoBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
  },
  portCode: { fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: 12 },
  srcItem:  { color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.6 },
};

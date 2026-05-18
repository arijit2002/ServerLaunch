import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_REGIONS } from '../utils/constants';
import { useToast } from './Toast';

export default function KeyPairs() {
  const [region,   setRegion]   = useState('us-east-1');
  const [keyPairs, setKeyPairs] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const toast = useToast();

  const load = useCallback(async (rgn) => {
    setLoading(true);
    const res = await window.serverLaunch.listKeyPairs(rgn);
    if (res.success) setKeyPairs(res.keyPairs);
    else toast(res.error, 'error');
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(region); }, [region]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) { toast('Enter a key pair name.', 'warning'); return; }
    if (!/^[\w-]{1,255}$/.test(name)) {
      toast('Name may only contain letters, numbers, hyphens, underscores.', 'warning');
      return;
    }
    setCreating(true);
    const res = await window.serverLaunch.createKeyPair({ name, region });
    setCreating(false);
    if (res.success) {
      setNewName('');
      toast(
        res.savedTo ? `Key pair created — saved to ${res.savedTo}` : 'Key pair created (private key not saved).',
        'success'
      );
      load(region);
    } else {
      toast(res.error, 'error');
    }
  }

  async function handleDelete(kp) {
    setDeleting(kp.keyPairId);
    const res = await window.serverLaunch.deleteKeyPair({ keyPairId: kp.keyPairId, region });
    setDeleting(null);
    setConfirm(null);
    if (res.success) {
      toast(`Deleted key pair "${kp.name}"`, 'success');
      load(region);
    } else {
      toast(res.error, 'error');
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Key Pairs</h2>
          <p style={styles.subtitle}>Manage EC2 SSH key pairs for your instances</p>
        </div>
        <div style={styles.topActions}>
          <select className="select" style={{ width: 220 }} value={region} onChange={e => setRegion(e.target.value)}>
            {DEFAULT_REGIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => load(region)} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Create new key pair */}
      <div style={styles.createCard}>
        <p style={styles.createTitle}>Create New Key Pair</p>
        <p style={styles.createNote}>
          AWS generates an RSA key pair. The private key is downloaded once — store it safely.
        </p>
        <div style={styles.createRow}>
          <input
            className="input"
            placeholder="my-key-pair"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ flex: 1, maxWidth: 320 }}
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <span className="spinner" style={{ width: 13, height: 13 }} /> : '+'}
            {' '}Create &amp; Download
          </button>
        </div>
      </div>

      {/* List */}
      <div style={styles.content}>
        {loading && keyPairs.length === 0 ? (
          <div className="empty-state">
            <span className="spinner" style={{ width: 28, height: 28 }} />
            <p>Loading key pairs…</p>
          </div>
        ) : keyPairs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔑</span>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>No key pairs in {region}</p>
            <p style={{ fontSize: 13 }}>Create one above to get started.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Name', 'Key Pair ID', 'Type', 'Fingerprint', 'Created', ''].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keyPairs.map((kp, i) => (
                  <tr key={kp.keyPairId} style={i % 2 !== 0 ? styles.altRow : {}}>
                    <td style={styles.td}>
                      <p style={styles.kpName}>{kp.name}</p>
                    </td>
                    <td style={styles.td}>
                      <code style={styles.mono}>{kp.keyPairId}</code>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{kp.type.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      <code style={{ ...styles.mono, fontSize: 10.5, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {kp.fingerprint || '—'}
                      </code>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {kp.createdAt ? new Date(kp.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirm(kp)}
                        disabled={deleting === kp.keyPairId}
                      >
                        {deleting === kp.keyPairId
                          ? <span className="spinner" style={{ width: 12, height: 12 }} />
                          : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>
              Delete Key Pair?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete <strong style={{ color: '#f1f5f9' }}>{confirm.name}</strong>.
              Instances using this key pair will be unaffected, but you won't be able to reference it when launching new ones.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '24px 28px 16px', gap: 16, flexShrink: 0,
  },
  pageTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  subtitle:  { fontSize: 13, color: 'var(--text-muted)', marginTop: 3 },
  topActions:{ display: 'flex', gap: 10, alignItems: 'center' },
  createCard: {
    margin: '0 28px 20px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '18px 20px',
    flexShrink: 0,
  },
  createTitle: { fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  createNote:  { fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 },
  createRow:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  content: { flex: 1, overflow: 'auto', padding: '0 28px 28px' },
  tableWrap: { overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '9px 14px',
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0,
  },
  td:     { padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' },
  altRow: { background: 'rgba(255,255,255,0.015)' },
  kpName: { fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' },
  mono:   { fontFamily: 'monospace', fontSize: 11.5, color: 'var(--text-secondary)' },
  typeBadge: {
    background: 'var(--bg-tertiary)', borderRadius: 4,
    padding: '2px 7px', fontSize: 11, fontWeight: 700,
    color: 'var(--text-secondary)', letterSpacing: '0.04em',
  },
};

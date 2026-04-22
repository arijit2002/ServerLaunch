import React, { useState, useEffect, useCallback } from 'react';
import InstanceCard from './InstanceCard';
import { DEFAULT_REGIONS } from '../utils/constants';
import { useToast } from './Toast';

const FILTERS = ['all', 'running', 'stopped', 'pending', 'terminated'];

export default function Dashboard({ onLaunch }) {
  const [instances, setInstances]  = useState([]);
  const [region, setRegion]        = useState('us-east-1');
  const [filter, setFilter]        = useState('all');
  const [loading, setLoading]      = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const toast = useToast();

  const fetchInstances = useCallback(async (rgn) => {
    setLoading(true);
    const res = await window.serverLaunch.listInstances(rgn || region);
    setLoading(false);
    if (res.success) {
      setInstances(res.instances);
      setLastRefresh(new Date());
    } else {
      toast(res.error, 'error');
    }
  }, [region, toast]);

  useEffect(() => { fetchInstances(region); }, [region]);

  const filtered = filter === 'all'
    ? instances
    : instances.filter(i => i.state === filter);

  const counts = instances.reduce((acc, i) => {
    acc[i.state] = (acc[i.state] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>EC2 Instances</h2>
          {lastRefresh && (
            <p style={styles.lastRefresh}>
              Last refreshed {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div style={styles.topActions}>
          <select
            className="select"
            style={{ width: 230 }}
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            {DEFAULT_REGIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => fetchInstances(region)} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↻'} Refresh
          </button>
          <button className="btn btn-primary" onClick={onLaunch}>
            ⊕ Launch Instance
          </button>
        </div>
      </div>

      <div style={styles.statsRow}>
        <StatCard label="Total"       count={instances.length}          color="#94a3b8" />
        <StatCard label="Running"     count={counts.running || 0}       color="#22c55e" />
        <StatCard label="Stopped"     count={counts.stopped || 0}       color="#f59e0b" />
        <StatCard label="Pending"     count={counts.pending || 0}       color="#a78bfa" />
        <StatCard label="Terminated"  count={counts.terminated || 0}    color="#ef4444" />
      </div>

      <div style={styles.filterBar}>
        {FILTERS.map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && counts[f] ? <span style={styles.filterCount}>{counts[f]}</span> : null}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {loading && instances.length === 0 ? (
          <div className="empty-state">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p>Loading instances…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {filter === 'all' ? 'No instances in this region' : `No ${filter} instances`}
            </p>
            <p style={{ fontSize: 13 }}>
              {filter === 'all' ? 'Launch one to get started.' : 'Try a different filter or region.'}
            </p>
            {filter === 'all' && (
              <button className="btn btn-primary" onClick={onLaunch} style={{ marginTop: 8 }}>
                ⊕ Launch Instance
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(instance => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onRefresh={() => fetchInstances(region)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div style={{ ...styles.stat, borderTop: `2px solid ${color}` }}>
      <p style={{ ...styles.statCount, color }}>{count}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 28px 16px',
    gap: 16,
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  lastRefresh: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  topActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexShrink: 0,
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    padding: '0 28px 16px',
    flexShrink: 0,
  },
  stat: {
    flex: 1,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 16px',
  },
  statCount: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  filterBar: {
    display: 'flex',
    gap: 4,
    padding: '0 28px 12px',
    flexShrink: 0,
  },
  filterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  },
  filterBtnActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  },
  filterCount: {
    background: 'var(--bg-tertiary)',
    borderRadius: 10,
    padding: '0 6px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '0 28px 28px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 14,
  },
};

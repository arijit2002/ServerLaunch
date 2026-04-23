import React, { useState } from 'react';
import { getStateColor, INSTANCE_TYPES } from '../utils/constants';
import { useToast } from './Toast';

export default function InstanceCard({ instance, onRefresh }) {
  const [loading, setLoading] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();
  const { id, name, state, type, publicIp, privateIp, region, platform, az } = instance;
  const stateColor  = getStateColor(state);
  const isRunning   = state === 'running';
  const isStopped   = state === 'stopped';
  const isDead      = state === 'terminated' || state === 'shutting-down';
  const typeInfo    = INSTANCE_TYPES.find(t => t.value === type);
  const hourlyPrice = typeInfo?.pricePerHour;

  async function doAction(action, successMsg) {
    setLoading(action);
    const res = await window.serverLaunch[`${action}Instance`]({ instanceId: id, region });
    setLoading(null);
    if (res.success) {
      toast(successMsg, 'success');
      setTimeout(onRefresh, 1500);
    } else {
      toast(res.error, 'error');
    }
  }

  return (
    <>
      <div style={{ ...styles.card, opacity: isDead ? 0.55 : 1 }}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <span style={{ ...styles.dot, background: stateColor, boxShadow: `0 0 6px ${stateColor}88` }} />
            <div>
              <p style={styles.name}>{name}</p>
              <p style={styles.idText}>{id}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span style={{ ...styles.badge, background: `${stateColor}22`, color: stateColor, border: `1px solid ${stateColor}44` }}>
              {state}
            </span>
            {isRunning && hourlyPrice && (
              <span style={styles.priceBadge}>${hourlyPrice.toFixed(4)}/hr</span>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          <InfoItem label="Type"       value={type} />
          <InfoItem label="Platform"   value={platform === 'windows' ? 'Windows' : 'Linux'} />
          <InfoItem label="Region"     value={region} />
          <InfoItem label="Zone"       value={az} />
          <InfoItem label="Public IP"  value={publicIp} mono />
          <InfoItem label="Private IP" value={privateIp} mono />
        </div>

        {!isDead && (
          <div style={styles.actions}>
            {isStopped && (
              <button className="btn btn-sm" style={styles.btnStart}
                disabled={!!loading} onClick={() => doAction('start', `Starting ${name}…`)}>
                {loading === 'start' ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '▶'} Start
              </button>
            )}
            {isRunning && (
              <button className="btn btn-sm" style={styles.btnStop}
                disabled={!!loading} onClick={() => doAction('stop', `Stopping ${name}…`)}>
                {loading === 'stop' ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '■'} Stop
              </button>
            )}
            {isRunning && (
              <button className="btn btn-secondary btn-sm"
                disabled={!!loading} onClick={() => doAction('reboot', `Rebooting ${name}…`)}>
                {loading === 'reboot' ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↺'} Reboot
              </button>
            )}
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}
              disabled={!!loading} onClick={() => setShowConfirm(true)}>
              ✕ Terminate
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>⚠ Terminate Instance?</h3>
            <p style={styles.modalText}>
              This will permanently terminate <strong style={{ color: '#f1f5f9' }}>{name}</strong> ({id}).
              All data on instance store volumes will be lost. This cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => {
                setShowConfirm(false);
                doAction('terminate', `Terminating ${name}…`);
              }}>
                Yes, Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoItem({ label, value, mono }) {
  return (
    <div style={styles.infoItem}>
      <p style={styles.infoLabel}>{label}</p>
      <p style={{ ...styles.infoValue, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '18px 20px',
    transition: 'border-color 150ms, transform 150ms',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 5,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 200,
  },
  idText: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  badge: {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11.5,
    fontWeight: 600,
    flexShrink: 0,
    textTransform: 'capitalize',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 16px',
  },
  infoItem: {},
  infoLabel: {
    fontSize: 10.5,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 12.5,
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    paddingTop: 4,
    borderTop: '1px solid var(--border)',
  },
  priceBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#22c55e',
    fontFamily: 'monospace',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 10,
    padding: '2px 7px',
  },
  btnStart: { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' },
  btnStop:  { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' },
  modalTitle: { fontSize: 17, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 },
  modalText:  { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
};

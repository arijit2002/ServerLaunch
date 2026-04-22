import React, { useState } from 'react';
import { INSTANCE_TYPES, DEFAULT_REGIONS, OS_OPTIONS } from '../utils/constants';
import { useToast } from './Toast';

const DEFAULT_FORM = {
  name: '',
  os: 'ubuntu',
  instanceType: 't3.micro',
  storageSize: 20,
  region: 'us-east-1',
};

export default function LaunchInstance({ onDone }) {
  const [form, setForm]     = useState(DEFAULT_FORM);
  const [step, setStep]     = useState('form');  // 'form' | 'launching' | 'done'
  const [result, setResult] = useState(null);
  const toast = useToast();

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLaunch = async () => {
    if (!form.name.trim()) {
      toast('Please enter an instance name.', 'warning');
      return;
    }
    setStep('launching');

    const amiRes = await window.serverLaunch.getAmiId({ os: form.os, region: form.region });
    if (!amiRes.success) {
      toast(`AMI lookup failed: ${amiRes.error}`, 'error');
      setStep('form');
      return;
    }

    const launchRes = await window.serverLaunch.launchInstance({
      amiId:        amiRes.amiId,
      instanceType: form.instanceType,
      region:       form.region,
      storageSize:  form.storageSize,
      name:         form.name,
      os:           form.os,
    });

    if (launchRes.success) {
      setResult(launchRes.instanceId);
      setStep('done');
      toast('Instance launched successfully!', 'success');
    } else {
      toast(`Launch failed: ${launchRes.error}`, 'error');
      setStep('form');
    }
  };

  if (step === 'launching') return <LaunchingScreen />;
  if (step === 'done') return <SuccessScreen instanceId={result} region={form.region} onDone={onDone} onAnother={() => { setForm(DEFAULT_FORM); setStep('form'); }} />;

  const selectedOS = OS_OPTIONS.find(o => o.value === form.os);

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>Launch Instance</h2>
          <p style={styles.subtitle}>Configure and launch a new EC2 instance</p>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.formCol}>
          {/* Name */}
          <Section title="1  Instance Name">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                className="input"
                type="text"
                placeholder="e.g. my-web-server"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
            </div>
          </Section>

          {/* OS */}
          <Section title="2  Operating System">
            <div style={styles.osGrid}>
              {OS_OPTIONS.map(os => (
                <button
                  key={os.value}
                  style={{
                    ...styles.osCard,
                    ...(form.os === os.value ? styles.osCardActive : {}),
                  }}
                  onClick={() => setField('os', os.value)}
                >
                  <span style={styles.osIcon}>{os.icon}</span>
                  <span style={styles.osLabel}>{os.label}</span>
                  {form.os === os.value && <span style={styles.osCheck}>✓</span>}
                </button>
              ))}
            </div>
          </Section>

          {/* Instance Type */}
          <Section title="3  Instance Type (RAM / vCPU)">
            <select className="select" value={form.instanceType} onChange={e => setField('instanceType', e.target.value)}>
              {INSTANCE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Section>

          {/* Storage */}
          <Section title="4  Storage (GB)">
            <div style={styles.storageRow}>
              <input
                className="input"
                type="number"
                min={8}
                max={16384}
                value={form.storageSize}
                onChange={e => setField('storageSize', Math.max(8, parseInt(e.target.value) || 8))}
                style={{ width: 120 }}
              />
              <input
                type="range"
                min={8}
                max={500}
                value={Math.min(form.storageSize, 500)}
                onChange={e => setField('storageSize', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.storageHint}>gp3 · up to 16,384 GB</span>
            </div>
          </Section>

          {/* Region */}
          <Section title="5  Region">
            <select className="select" value={form.region} onChange={e => setField('region', e.target.value)}>
              {DEFAULT_REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Section>
        </div>

        {/* Summary Panel */}
        <div style={styles.summaryCol}>
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>Summary</h3>
            <div style={styles.summaryRows}>
              <SummaryRow label="Name"         value={form.name || '—'} />
              <SummaryRow label="OS"           value={`${selectedOS.icon} ${selectedOS.label}`} />
              <SummaryRow label="Type"         value={form.instanceType} mono />
              <SummaryRow label="Storage"      value={`${form.storageSize} GB (gp3)`} />
              <SummaryRow label="Region"       value={DEFAULT_REGIONS.find(r => r.value === form.region)?.label || form.region} />
            </div>

            <div style={styles.noteBox}>
              <p style={styles.noteText}>
                ⚠ A new instance will incur AWS charges based on the type and running time.
              </p>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleLaunch}
              style={{ marginTop: 20 }}
            >
              ⊕ Launch Instance
            </button>
            <button className="btn btn-ghost btn-full" onClick={onDone} style={{ marginTop: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}>{title}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, mono }) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={{ ...styles.summaryValue, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

function LaunchingScreen() {
  return (
    <div style={styles.centered}>
      <div style={styles.launchCard}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderTopColor: '#3b82f6' }} />
        <p style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginTop: 20 }}>Launching Instance…</p>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Looking up AMI and requesting instance. This may take a moment.</p>
      </div>
    </div>
  );
}

function SuccessScreen({ instanceId, region, onDone, onAnother }) {
  return (
    <div style={styles.centered}>
      <div style={styles.launchCard}>
        <div style={styles.successIcon}>✓</div>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginTop: 16 }}>Instance Launched!</p>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>It may take a few minutes to become available.</p>
        <div style={styles.instanceIdBox}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>INSTANCE ID</p>
          <p style={{ fontFamily: 'monospace', fontSize: 14, color: '#93c5fd' }}>{instanceId}</p>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{region}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onDone}>
            View Dashboard
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onAnother}>
            Launch Another
          </button>
        </div>
      </div>
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
    padding: '24px 28px 16px',
    flexShrink: 0,
    borderBottom: '1px solid var(--border)',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  body: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    gap: 24,
    padding: 28,
    alignItems: 'flex-start',
  },
  formCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    minWidth: 0,
  },
  summaryCol: {
    width: 280,
    flexShrink: 0,
    position: 'sticky',
    top: 0,
  },
  section: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '18px 20px',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 14,
    letterSpacing: '-0.01em',
  },
  osGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  osCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 150ms, color 150ms',
    fontSize: 13.5,
    fontWeight: 500,
    position: 'relative',
  },
  osCardActive: {
    borderColor: 'var(--accent)',
    color: 'var(--text-primary)',
    background: 'var(--accent-dim)',
  },
  osIcon: { fontSize: 20 },
  osLabel: { flex: 1 },
  osCheck: {
    position: 'absolute',
    right: 12,
    color: 'var(--accent)',
    fontWeight: 700,
    fontSize: 14,
  },
  storageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  slider: {
    flex: 1,
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  storageHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  summaryCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  summaryRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  summaryValue: {
    fontSize: 12.5,
    color: 'var(--text-secondary)',
    textAlign: 'right',
    wordBreak: 'break-all',
  },
  noteBox: {
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    marginTop: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 1.5,
  },
  centered: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  launchCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '40px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 400,
    width: '100%',
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(34,197,94,0.15)',
    border: '2px solid #22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    color: '#22c55e',
    fontWeight: 700,
  },
  instanceIdBox: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 16px',
    marginTop: 20,
    width: '100%',
    textAlign: 'center',
  },
};

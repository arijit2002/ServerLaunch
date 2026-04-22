import React, { useState } from 'react';
import { useToast } from './Toast';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ accessKeyId: '', secretAccessKey: '' });
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accessKeyId.trim() || !form.secretAccessKey.trim()) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await window.serverLaunch.setCredentials(form);
    setLoading(false);
    if (res.success) {
      toast('Authenticated successfully!', 'success');
      onLogin();
    } else {
      setError(res.error || 'Authentication failed. Check your credentials.');
    }
  };

  return (
    <div style={styles.bg}>
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>☁</div>
          <div>
            <h1 style={styles.appName}>ServerLaunch</h1>
            <p style={styles.tagline}>EC2 Instance Manager</p>
          </div>
        </div>

        <div style={styles.divider} />

        <p style={styles.subtitle}>
          Enter your AWS credentials to get started. Keys are kept in memory only — never stored on disk.
        </p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="label">AWS Access Key ID</label>
            <input
              className="input"
              type="text"
              name="accessKeyId"
              value={form.accessKeyId}
              onChange={handleChange}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label className="label">AWS Secret Access Key</label>
            <div style={styles.pwWrapper}>
              <input
                className="input"
                type={showSecret ? 'text' : 'password'}
                name="secretAccessKey"
                value={form.secretAccessKey}
                onChange={handleChange}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfi..."
                style={{ paddingRight: 40 }}
                spellCheck={false}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowSecret(s => !s)}
              >
                {showSecret ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner" /> Validating…</> : 'Connect to AWS'}
          </button>
        </form>

        <p style={styles.hint}>
          Requires EC2 and SSM read permissions. Use IAM policies to limit access.
        </p>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #0d2244 50%, #0f172a 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 300,
    background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(30,41,59,0.9)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '40px 44px',
    width: '100%',
    maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  logoIcon: {
    width: 52,
    height: 52,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
    flexShrink: 0,
  },
  appName: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.07)',
    margin: '20px 0',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  pwWrapper: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    opacity: 0.6,
    padding: 0,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#fca5a5',
    marginBottom: 14,
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  hint: {
    marginTop: 20,
    fontSize: 11.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 1.6,
  },
};

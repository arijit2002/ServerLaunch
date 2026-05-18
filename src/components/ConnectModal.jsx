import React, { useState } from 'react';
import { useToast } from './Toast';

const SSH_USERS = {
  linux:   ['ec2-user', 'ubuntu', 'admin', 'root'],
  windows: ['Administrator'],
};

export default function ConnectModal({ instance, onClose }) {
  const { id, name, publicIp, privateIp, platform, keyName, region } = instance;
  const isWindows = platform === 'windows';
  const toast = useToast();

  const [sshUser, setSshUser]   = useState(isWindows ? 'Administrator' : 'ec2-user');
  const [copied,  setCopied]    = useState(null);

  const hasPublicIp = publicIp && publicIp !== '—';
  const keyArg      = keyName ? `-i ~/.ssh/${keyName}.pem ` : '';

  const sshCmd  = `ssh ${keyArg}${sshUser}@${hasPublicIp ? publicIp : privateIp}`;
  const ssmCmd  = `aws ssm start-session --target ${id} --region ${region}`;
  const rdpNote = `mstsc /v:${hasPublicIp ? publicIp : privateIp}`;

  async function copy(text, key) {
    await window.serverLaunch.copyToClipboard(text);
    setCopied(key);
    toast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(null), 2000);
  }

  async function openTerminal(cmd) {
    const res = await window.serverLaunch.openTerminal({ command: cmd });
    if (!res.success) toast(res.error, 'error');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Connect to Instance</h3>
            <p style={styles.sub}>{name} · {id}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!hasPublicIp && (
          <div style={styles.warn}>
            No public IP assigned — SSH commands use the private IP. Ensure you're on a VPN or bastion.
          </div>
        )}

        {!keyName && (
          <div style={styles.warn}>
            No key pair associated with this instance. SSH may not be available.
          </div>
        )}

        {/* SSH Section */}
        {!isWindows && (
          <Section title="SSH" icon="⌨">
            <label style={styles.label}>Username</label>
            <div style={styles.userRow}>
              {SSH_USERS.linux.map(u => (
                <button
                  key={u}
                  style={{ ...styles.userBtn, ...(sshUser === u ? styles.userBtnActive : {}) }}
                  onClick={() => setSshUser(u)}
                >
                  {u}
                </button>
              ))}
            </div>
            <CommandBox cmd={sshCmd} copied={copied === 'ssh'} onCopy={() => copy(sshCmd, 'ssh')} onTerminal={() => openTerminal(sshCmd)} />
          </Section>
        )}

        {/* RDP Section (Windows) */}
        {isWindows && (
          <Section title="Remote Desktop (RDP)" icon="🖥">
            <p style={styles.note}>Use Windows Remote Desktop to connect.</p>
            <CommandBox cmd={rdpNote} copied={copied === 'rdp'} onCopy={() => copy(rdpNote, 'rdp')} />
          </Section>
        )}

        {/* SSM Section */}
        <Section title="AWS SSM Session Manager" icon="☁">
          <p style={styles.note}>No open ports or key pair required. Requires AWS CLI + SSM plugin installed locally.</p>
          <CommandBox cmd={ssmCmd} copied={copied === 'ssm'} onCopy={() => copy(ssmCmd, 'ssm')} onTerminal={() => openTerminal(ssmCmd)} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}><span style={styles.sectionIcon}>{icon}</span>{title}</p>
      {children}
    </div>
  );
}

function CommandBox({ cmd, copied, onCopy, onTerminal }) {
  return (
    <div style={styles.cmdBox}>
      <code style={styles.cmd}>{cmd}</code>
      <div style={styles.cmdActions}>
        <button className="btn btn-sm btn-secondary" onClick={onCopy} style={{ minWidth: 68 }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        {onTerminal && (
          <button className="btn btn-sm btn-primary" onClick={onTerminal}>
            Open Terminal
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  modal: { maxWidth: 520, width: '92%' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  warn: {
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12.5,
    color: '#f59e0b',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: { fontSize: 15 },
  label: { fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block' },
  note:  { fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 },
  userRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  userBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'border-color 150ms, color 150ms',
  },
  userBtnActive: {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
  },
  cmdBox: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  cmd: {
    flex: 1,
    fontSize: 12.5,
    color: '#93c5fd',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    userSelect: 'all',
  },
  cmdActions: { display: 'flex', gap: 6, flexShrink: 0 },
};

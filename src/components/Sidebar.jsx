import React from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '▦',  label: 'Dashboard' },
  { id: 'launch',    icon: '⊕',  label: 'Launch Instance' },
];

export default function Sidebar({ page, onNavigate, onLogout }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandIcon}>☁</div>
        <span style={styles.brandName}>ServerLaunch</span>
      </div>

      <nav style={styles.nav}>
        <p style={styles.navSection}>Navigation</p>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            style={{
              ...styles.navItem,
              ...(page === item.id ? styles.navItemActive : {}),
            }}
            onClick={() => onNavigate(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {page === item.id && <span style={styles.activeBar} />}
          </button>
        ))}
      </nav>

      <div style={styles.bottom}>
        <div style={styles.divider} />
        <button style={styles.logoutBtn} onClick={onLogout}>
          <span>⏻</span>
          <span>Disconnect</span>
        </button>
        <p style={styles.version}>ServerLaunch v1.0</p>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100%',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    userSelect: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px 20px',
  },
  brandIcon: {
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
    flexShrink: 0,
  },
  brandName: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  nav: {
    flex: 1,
    padding: '0 12px',
  },
  navSection: {
    fontSize: 10.5,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0 8px',
    marginBottom: 8,
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13.5,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 150ms, color 150ms',
    marginBottom: 2,
    position: 'relative',
  },
  navItemActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  },
  navIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
    flexShrink: 0,
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    height: '60%',
    width: 3,
    background: 'var(--accent)',
    borderRadius: '3px 0 0 3px',
  },
  bottom: {
    padding: '0 12px',
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    marginBottom: 12,
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13.5,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 150ms, color 150ms',
  },
  version: {
    fontSize: 11,
    color: 'var(--text-muted)',
    padding: '10px 10px 0',
  },
};

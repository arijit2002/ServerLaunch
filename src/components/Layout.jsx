import React from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import LaunchInstance from './LaunchInstance';
import KeyPairs from './KeyPairs';

export default function Layout({ page, onNavigate, onLogout }) {
  return (
    <div style={styles.root}>
      <Sidebar page={page} onNavigate={onNavigate} onLogout={onLogout} />
      <main style={styles.main}>
        {page === 'dashboard' && <Dashboard onLaunch={() => onNavigate('launch')} />}
        {page === 'launch'    && <LaunchInstance onDone={() => onNavigate('dashboard')} />}
        {page === 'keypairs'  && <KeyPairs />}
      </main>
    </div>
  );
}

const styles = {
  root: { display: 'flex', height: '100%', overflow: 'hidden' },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};

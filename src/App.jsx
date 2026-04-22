import React, { useState, useCallback } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState('dashboard');

  const handleLogin = useCallback(() => setIsLoggedIn(true), []);

  const handleLogout = useCallback(async () => {
    await window.serverLaunch.clearCredentials();
    setIsLoggedIn(false);
    setPage('dashboard');
  }, []);

  return (
    <ToastProvider>
      {isLoggedIn
        ? <Layout page={page} onNavigate={setPage} onLogout={handleLogout} />
        : <Login onLogin={handleLogin} />}
    </ToastProvider>
  );
}

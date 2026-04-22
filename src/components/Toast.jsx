import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={styles.container}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...styles.toast, ...styles[t.type] }}>
            <span style={styles.icon}>{ICONS[t.type]}</span>
            <span style={styles.msg}>{t.message}</span>
            <button style={styles.close} onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

const styles = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    pointerEvents: 'all',
    animation: 'fadeSlideIn 0.2s ease',
    maxWidth: 340,
  },
  success: { background: '#166534', color: '#bbf7d0', border: '1px solid #16a34a' },
  error:   { background: '#7f1d1d', color: '#fecaca', border: '1px solid #ef4444' },
  info:    { background: '#1e3a5f', color: '#bfdbfe', border: '1px solid #3b82f6' },
  warning: { background: '#78350f', color: '#fde68a', border: '1px solid #f59e0b' },
  icon:    { fontSize: 14, flexShrink: 0 },
  msg:     { flex: 1 },
  close: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 12,
    opacity: 0.6,
    padding: '0 2px',
    flexShrink: 0,
  },
};

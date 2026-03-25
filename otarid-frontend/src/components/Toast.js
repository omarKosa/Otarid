import React, { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    error:   { bg: 'var(--danger-dim)',  border: 'var(--danger)',  text: '#f08080' },
    success: { bg: 'var(--success-dim)', border: 'var(--success)', text: '#7ed4a8' },
    info:    { bg: 'var(--accent-dim)',  border: 'var(--accent)',  text: '#9898e8' },
  };
  const c = colors[type] || colors.error;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      padding: '12px 18px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '14px',
      maxWidth: '340px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'fadeUp 0.3s ease both',
      backdropFilter: 'blur(8px)',
      boxShadow: 'var(--shadow)',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', color: c.text, fontSize: '16px', opacity: 0.6, padding: '0 2px' }}
      >×</button>
    </div>
  );
}

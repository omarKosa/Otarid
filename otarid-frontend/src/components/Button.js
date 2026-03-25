import React from 'react';
import Spinner from './Spinner';

export default function Button({ children, loading, variant = 'primary', ...props }) {
  const styles = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--danger-dim)',
      color: 'var(--danger)',
      border: '1px solid var(--danger)',
    },
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '15px',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'opacity 0.2s, transform 0.15s',
        opacity: loading || props.disabled ? 0.6 : 1,
        cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.01em',
        ...styles[variant],
        ...props.style,
      }}
      onMouseEnter={e => { if (!loading && !props.disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = loading || props.disabled ? '0.6' : '1'; }}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

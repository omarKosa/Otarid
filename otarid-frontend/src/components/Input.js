import React, { useState } from 'react';

export default function Input({ label, type = 'text', error, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.03em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          {...props}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            padding: isPassword ? '11px 44px 11px 14px' : '11px 14px',
            fontSize: '15px',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', color: 'var(--text-dim)', fontSize: '13px', padding: '2px',
            }}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: '13px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(91,91,214,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'var(--accent)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: '#fff',
            }}>O</div>
            <span style={{
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}>Otarid</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

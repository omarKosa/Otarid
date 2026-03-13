import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { forgotPassword } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {sent ? (
        <div className="fade-up" style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--success-dim)',
            border: '1px solid var(--success)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 20px',
          }}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '10px' }}>
            Check your inbox
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            If <strong style={{ color: 'var(--text)' }}>{email}</strong> exists in our system,
            you'll receive a reset link shortly.
          </p>
          <Link to="/" style={{ fontSize: '14px' }}>← Back to sign in</Link>
        </div>
      ) : (
        <>
          <div className="fade-up" style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              Reset your password
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="fade-up fade-up-delay-1">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="fade-up fade-up-delay-2">
              <Button type="submit" loading={loading}>Send reset link</Button>
            </div>

            <div className="fade-up fade-up-delay-3" style={{ textAlign: 'center' }}>
              <Link to="/" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>← Back to sign in</Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { resetPassword } from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setToast({ message: 'Password must be at least 8 characters', type: 'error' });
      return;
    }
    if (password !== confirm) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {done ? (
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
            Password updated!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Redirecting you to sign in...
          </p>
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
              Set new password
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Must be at least 8 characters with one uppercase letter and one number.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="fade-up fade-up-delay-1">
              <Input
                label="New password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="fade-up fade-up-delay-2">
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
            <div className="fade-up fade-up-delay-3">
              <Button type="submit" loading={loading}>Update password</Button>
            </div>
            <div className="fade-up fade-up-delay-4" style={{ textAlign: 'center' }}>
              <Link to="/" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>← Back to sign in</Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

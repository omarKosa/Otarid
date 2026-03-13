import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { login, register } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginRegister() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    if (mode === 'register' && form.password.length < 8) e.password = 'Minimum 8 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const data = mode === 'login'
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, password: form.password });

      loginUser(data.accessToken, data.user);
      navigate('/profile');
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setForm({ name: '', email: '', password: '' });
    setErrors({});
  };

  return (
    <AuthLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Tab switcher */}
      <div className="fade-up" style={{
        display: 'flex',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px',
        marginBottom: '28px',
      }}>
        {['login', 'register'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setForm({ name: '', email: '', password: '' }); setErrors({}); }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: mode === m ? 'var(--bg-card)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-muted)',
              border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all 0.2s',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {mode === 'register' && (
          <div className="fade-up">
            <Input
              label="Full name"
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              autoFocus
            />
          </div>
        )}

        <div className="fade-up fade-up-delay-1">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            autoFocus={mode === 'login'}
          />
        </div>

        <div className="fade-up fade-up-delay-2">
          <Input
            label="Password"
            type="password"
            placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
        </div>

        {mode === 'login' && (
          <div className="fade-up fade-up-delay-3" style={{ textAlign: 'right', marginTop: '-8px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Forgot password?
            </Link>
          </div>
        )}

        <div className="fade-up fade-up-delay-4" style={{ marginTop: '4px' }}>
          <Button type="submit" loading={loading}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

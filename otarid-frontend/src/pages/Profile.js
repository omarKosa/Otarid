import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { updateProfile, uploadAvatar, deleteAvatar, changePassword, deleteAccount } from '../utils/api';

const AVATAR_BASE = 'http://localhost:5000';

function Section({ title, children, delay = 0 }) {
  return (
    <div
      className={`fade-up fade-up-delay-${delay}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '28px',
        marginBottom: '16px',
      }}
    >
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '22px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, logoutUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', bio: user?.bio || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'error') => setToast({ message, type });

  // ── Profile update ──
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const data = await updateProfile(profileForm);
      updateUser(data.user);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // ── Avatar ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingAvatar(true);
    try {
      const data = await uploadAvatar(file);
      updateUser(data.user);
      showToast('Avatar updated', 'success');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setLoadingAvatar(true);
    try {
      const data = await deleteAvatar();
      updateUser(data.user);
      showToast('Avatar removed', 'info');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingAvatar(false);
    }
  };

  // ── Change password ──
  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      showToast('Both fields are required'); return;
    }
    setLoadingPw(true);
    try {
      await changePassword(pwForm);
      showToast('Password changed. Please log in again.', 'success');
      setTimeout(() => { logoutUser(); navigate('/'); }, 2000);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingPw(false);
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (!deletePassword) { showToast('Enter your password to confirm'); return; }
    setLoadingDelete(true);
    try {
      await deleteAccount(deletePassword);
      logoutUser();
      navigate('/');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingDelete(false);
    }
  };

  const avatarSrc = user?.avatar ? `${AVATAR_BASE}${user.avatar}` : null;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '0',
    }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Top nav */}
      <nav className="fade-up" style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--accent)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 800,
            fontFamily: 'var(--font-display)', color: '#fff',
          }}>O</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
            Otarid
          </span>
        </div>
        <button
          onClick={() => { logoutUser(); navigate('/'); }}
          style={{
            background: 'none', color: 'var(--text-muted)', fontSize: '14px',
            padding: '7px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          Sign out
        </button>
      </nav>

      {/* Page content */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <div className="fade-up" style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '4px',
          }}>
            Your Profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Manage your account settings and preferences.
          </p>
        </div>

        {/* ── Avatar ── */}
        <Section title="Avatar" delay={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar circle */}
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '50%',
              background: avatarSrc ? 'transparent' : 'var(--accent-dim)',
              border: '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--accent)',
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              <Button
                onClick={() => fileRef.current.click()}
                loading={loadingAvatar}
                style={{ width: 'auto', padding: '9px 18px', fontSize: '14px' }}
              >
                {loadingAvatar ? 'Uploading...' : 'Upload photo'}
              </Button>
              {user?.avatar && (
                <button
                  onClick={handleDeleteAvatar}
                  style={{
                    background: 'none', color: 'var(--text-muted)', fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
                  }}
                >
                  Remove photo
                </button>
              )}
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                JPEG, PNG or WebP · max 5MB
              </p>
            </div>
          </div>
        </Section>

        {/* ── Profile info ── */}
        <Section title="Personal Info" delay={2}>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Full name"
              value={profileForm.name}
              onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Email address"
              type="email"
              value={profileForm.email}
              onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
            />
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>
                Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                maxLength={200}
                placeholder="A short bio about yourself..."
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  padding: '11px 14px',
                  fontSize: '15px',
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'right', marginTop: '4px' }}>
                {profileForm.bio.length}/200
              </div>
            </div>
            <Button type="submit" loading={loadingProfile} style={{ marginTop: '4px' }}>
              Save changes
            </Button>
          </form>
        </Section>

        {/* ── Change password ── */}
        <Section title="Change Password" delay={3}>
          <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Current password"
              type="password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
            />
            <Input
              label="New password"
              type="password"
              placeholder="Min. 8 characters"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
            />
            <Button type="submit" loading={loadingPw} variant="ghost" style={{ marginTop: '4px' }}>
              Update password
            </Button>
          </form>
        </Section>

        {/* ── Danger zone ── */}
        <Section title="Danger Zone" delay={4}>
          {!confirmDelete ? (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setConfirmDelete(true)} style={{ width: 'auto', padding: '9px 18px', fontSize: '14px' }}>
                Delete account
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '14px', color: 'var(--danger)' }}>
                Enter your password to confirm deletion:
              </p>
              <Input
                type="password"
                placeholder="Your current password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="danger" loading={loadingDelete} onClick={handleDeleteAccount}>
                  Yes, delete my account
                </Button>
                <Button variant="ghost" onClick={() => { setConfirmDelete(false); setDeletePassword(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

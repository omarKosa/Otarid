const BASE = '/api/v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem('accessToken');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const handle = async (res) => {
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Something went wrong');
  return data;
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const register = (body) =>
  fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  }).then(handle);

export const login = (body) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  }).then(handle);

export const logout = () =>
  fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
  }).then(handle);

export const refreshToken = () =>
  fetch(`${BASE}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
  }).then(handle);

export const getMe = () =>
  fetch(`${BASE}/auth/me`, {
    headers: authHeaders(),
    credentials: 'include',
  }).then(handle);

export const forgotPassword = (email) =>
  fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(handle);

export const googleLogin = (credential) =>
  fetch(`${BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential }),
  }).then(handle);

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = () =>
  fetch(`${BASE}/profile`, {
    headers: authHeaders(),
    credentials: 'include',
  }).then(handle);

export const updateProfile = (body) =>
  fetch(`${BASE}/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  }).then(handle);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return fetch(`${BASE}/profile/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` }, // no Content-Type for FormData
    credentials: 'include',
    body: formData,
  }).then(handle);
};

export const deleteAvatar = () =>
  fetch(`${BASE}/profile/avatar`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  }).then(handle);

export const changePassword = (body) =>
  fetch(`${BASE}/profile/change-password`, {
    method: 'PATCH',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  }).then(handle);

export const deleteAccount = (password) =>
  fetch(`${BASE}/profile/delete-account`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify({ password }),
  }).then(handle);

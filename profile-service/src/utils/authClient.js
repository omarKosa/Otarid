/**
 * Sync name/email changes to authentication-service (auth_db).
 */
const syncUserToAuth = async (userId, body) => {
  const base = process.env.AUTH_SERVICE_URL;
  if (!base) {
    throw new Error('AUTH_SERVICE_URL is not configured.');
  }
  const url = `${base.replace(/\/$/, '')}/internal/users/${userId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

module.exports = { syncUserToAuth };

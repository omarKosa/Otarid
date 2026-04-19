const logger = require('./logger');

const internalHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
});

/**
 * Create profile row after registration (profile_db).
 */
const bootstrapProfile = async ({ userId, name, email }) => {
  const base = process.env.PROFILE_SERVICE_URL;
  if (!base) {
    throw new Error('PROFILE_SERVICE_URL is not configured.');
  }
  const url = `${base.replace(/\/$/, '')}/internal/profile/bootstrap`;
  const res = await fetch(url, {
    method: 'POST',
    headers: internalHeaders(),
    body: JSON.stringify({ userId, name, email }),
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error('Profile bootstrap failed', { status: res.status, body: text });
    throw new Error(`Profile bootstrap failed: ${res.status}`);
  }
};

/**
 * Remove profile row and avatar files before deleting the auth user.
 */
const deleteProfileRemote = async (userId) => {
  const base = process.env.PROFILE_SERVICE_URL;
  if (!base) {
    throw new Error('PROFILE_SERVICE_URL is not configured.');
  }
  const url = `${base.replace(/\/$/, '')}/internal/profile/${userId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: internalHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error('Profile delete (internal) failed', { status: res.status, body: text });
    throw new Error(`Profile delete failed: ${res.status}`);
  }
};

module.exports = { bootstrapProfile, deleteProfileRemote };

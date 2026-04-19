const path = require('path');
const fs = require('fs');
const Profile = require('../models/Profile');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.bootstrapProfile = asyncHandler(async (req, res) => {
  const { userId, name, email } = req.body;

  if (!userId || !name || !email) {
    return res.status(400).json({ success: false, message: 'userId, name, and email are required.' });
  }

  const existing = await Profile.findByPk(userId);
  if (existing) {
    return res.status(200).json({ success: true, message: 'Profile already exists.' });
  }

  await Profile.create({ userId, name, email, bio: '' });
  logger.info('Profile bootstrapped.', { userId });

  res.status(201).json({ success: true });
});

exports.deleteProfileInternal = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const profile = await Profile.findByPk(userId);

  if (!profile) {
    return res.status(200).json({ success: true, message: 'No profile to delete.' });
  }

  if (profile.avatar) {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    fs.unlink(path.join(uploadDir, path.basename(profile.avatar)), () => {});
  }

  await profile.destroy();
  logger.info('Profile deleted (internal).', { userId });

  res.status(200).json({ success: true });
});

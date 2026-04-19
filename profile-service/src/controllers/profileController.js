const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Profile = require('../models/Profile');
const { asyncHandler } = require('../middleware/errorHandler');
const { syncUserToAuth } = require('../utils/authClient');
const logger = require('../utils/logger');

const toPublicUser = (profile) => {
  const p = profile.toJSON ? profile.toJSON() : profile;
  return {
    id: p.userId,
    name: p.name,
    email: p.email,
    bio: p.bio,
    avatar: p.avatar,
  };
};

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findByPk(req.user.id);
  logger.debug('Fetched user profile.', { userId: req.user.id });
  res.status(200).json({ success: true, user: toPublicUser(profile) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ['name', 'bio'].forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (req.body.email && req.body.email !== req.user.email) {
    const exists = await Profile.findOne({ where: { email: req.body.email } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    updates.email = req.body.email;
  }

  const syncBody = {};
  if (updates.name !== undefined) syncBody.name = updates.name;
  if (updates.email !== undefined) syncBody.email = updates.email;

  if (Object.keys(syncBody).length > 0) {
    const { ok, status, data } = await syncUserToAuth(req.user.id, syncBody);
    if (status === 409) {
      return res.status(409).json({ success: false, message: data.message || 'Email already in use.' });
    }
    if (!ok) {
      logger.error('Auth sync failed during profile update.', { status, data });
      return res.status(502).json({ success: false, message: 'Could not update account details.' });
    }
  }

  const [, [profile]] = await Profile.update(updates, {
    where: { userId: req.user.id },
    returning: true,
  });

  logger.info('User profile updated.', {
    userId: req.user.id,
    updatedFields: Object.keys(updates),
  });

  res.status(200).json({ success: true, user: toPublicUser(profile) });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    logger.warn('Avatar upload attempted without file.', {
      userId: req.user.id,
    });
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const uploadDir = process.env.UPLOAD_PATH || './uploads';
  const filename = `avatar-${req.user.id}-${Date.now()}.webp`;
  const outputPath = path.join(uploadDir, filename);

  await sharp(req.file.path)
    .resize(200, 200, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outputPath);

  fs.unlink(req.file.path, () => {});

  if (req.user.avatar) {
    fs.unlink(path.join(uploadDir, path.basename(req.user.avatar)), () => {});
  }

  const avatarUrl = `/uploads/${filename}`;
  const [, [profile]] = await Profile.update(
    { avatar: avatarUrl },
    { where: { userId: req.user.id }, returning: true }
  );

  logger.info('User avatar updated.', {
    userId: req.user.id,
    avatar: avatarUrl,
  });

  res.status(200).json({ success: true, user: toPublicUser(profile) });
});

exports.deleteAvatar = asyncHandler(async (req, res) => {
  if (req.user.avatar) {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    fs.unlink(path.join(uploadDir, path.basename(req.user.avatar)), () => {});
  }

  const [, [profile]] = await Profile.update(
    { avatar: null },
    { where: { userId: req.user.id }, returning: true }
  );

  logger.info('User avatar deleted.', {
    userId: req.user.id,
  });

  res.status(200).json({ success: true, user: toPublicUser(profile) });
});

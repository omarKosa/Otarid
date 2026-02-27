const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/v1/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  res.status(200).json({ success: true, user });
});

// PATCH /api/v1/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ['name', 'bio'].forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // Email change — check uniqueness first
  if (req.body.email && req.body.email !== req.user.email) {
    const exists = await User.findOne({ where: { email: req.body.email } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    updates.email = req.body.email;
  }

  const [, [user]] = await User.update(updates, {
    where: { id: req.user.id },
    returning: true,
  });

  res.status(200).json({ success: true, user });
});

// POST /api/v1/profile/avatar
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const uploadDir = process.env.UPLOAD_PATH || './uploads';
  const filename = `avatar-${req.user.id}-${Date.now()}.webp`;
  const outputPath = path.join(uploadDir, filename);

  // Resize + convert to WebP
  await sharp(req.file.path)
    .resize(200, 200, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outputPath);

  // Delete the original temp file
  fs.unlink(req.file.path, () => {});

  // Delete old avatar from disk
  if (req.user.avatar) {
    fs.unlink(path.join(uploadDir, path.basename(req.user.avatar)), () => {});
  }

  const avatarUrl = `/uploads/${filename}`;
  const [, [user]] = await User.update(
    { avatar: avatarUrl },
    { where: { id: req.user.id }, returning: true }
  );

  res.status(200).json({ success: true, user });
});

// DELETE /api/v1/profile/avatar
exports.deleteAvatar = asyncHandler(async (req, res) => {
  if (req.user.avatar) {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    fs.unlink(path.join(uploadDir, path.basename(req.user.avatar)), () => {});
  }

  const [, [user]] = await User.update(
    { avatar: null },
    { where: { id: req.user.id }, returning: true }
  );

  res.status(200).json({ success: true, user });
});

// PATCH /api/v1/profile/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }

  const user = await User.scope('withSecrets').findByPk(req.user.id);
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  user.refreshTokens = []; // log out all other sessions
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

// DELETE /api/v1/profile/delete-account
exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required to delete account.' });
  }

  const user = await User.scope('withSecrets').findByPk(req.user.id);
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }

  // Delete avatar file from disk
  if (user.avatar) {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    fs.unlink(path.join(uploadDir, path.basename(user.avatar)), () => {});
  }

  await user.destroy();

  res.clearCookie('refreshToken').status(200).json({ success: true, message: 'Account deleted successfully.' });
});

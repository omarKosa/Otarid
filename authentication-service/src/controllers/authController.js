const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendTokenResponse } = require('../utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const { bootstrapProfile, deleteProfileRemote } = require('../utils/profileClient');
const { publishEvent } = require('../utils/publisher');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    logger.warn('Registration attempted with existing email.', {
      email,
      ip: req.ip,
    });
    return res.status(409).json({ success: false, message: 'Email already in use.' });
  }

  const user = await User.create({ name, email, password });

  try {
    await bootstrapProfile({ userId: user.id, name: user.name, email: user.email });
  } catch (err) {
    await user.destroy();
    throw err;
  }

  try {
    await publishEvent('user.registered', {
      email: user.email,
      name: user.name,
      userId: user.id,
    });
  } catch (err) {
    logger.warn('RabbitMQ publish failed for user.registered. Falling back to direct welcome email.', {
      userId: user.id,
      email: user.email,
      error: err.message,
    });

    await sendWelcomeEmail({ to: email, name });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
  await user.save();

  logger.info('User registered successfully.', {
    userId: user.id,
    email: user.email,
  });

  sendTokenResponse(res, 201, user.toSafeJSON(), accessToken, refreshToken);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withSecrets').findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    logger.warn('Invalid login attempt.', {
      email,
      ip: req.ip,
    });
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    logger.warn('Inactive user attempted login.', {
      userId: user.id,
      email: user.email,
    });
    return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  const tokens = [...(user.refreshTokens || []), { token: refreshToken, createdAt: new Date() }];
  user.refreshTokens = tokens.slice(-5);
  await user.save();

  logger.info('User login successful.', {
    userId: user.id,
    email: user.email,
  });

  sendTokenResponse(res, 200, user.toSafeJSON(), accessToken, refreshToken);
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    const user = await User.scope('withSecrets').findByPk(req.user.id);
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
      await user.save();
      logger.info('User logged out.', {
        userId: user.id,
      });
    }
  }

  res.clearCookie('refreshToken').status(200).json({ success: true, message: 'Logged out successfully.' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    logger.warn('Refresh token missing.', {
      path: req.originalUrl,
      ip: req.ip,
    });
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    logger.warn('Invalid or expired refresh token.', {
      error: err.message,
    });
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  const user = await User.scope('withSecrets').findByPk(decoded.id);
  if (!user || !(user.refreshTokens || []).some((t) => t.token === token)) {
    logger.warn('Refresh token not recognised.', {
      userId: decoded.id,
    });
    return res.status(401).json({ success: false, message: 'Refresh token not recognised.' });
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user.id);

  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((t) => t.token !== token),
    { token: newRefreshToken, createdAt: new Date() },
  ];
  await user.save();

  logger.info('Refresh token rotated.', {
    userId: user.id,
  });

  sendTokenResponse(res, 200, user.toSafeJSON(), newAccessToken, newRefreshToken);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.scope('withSecrets').findOne({ where: { email: req.body.email } });

  if (!user) {
    logger.info('Password reset requested for non-existing email.', {
      email: req.body.email,
      ip: req.ip,
    });
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await publishEvent('password.reset', {
      email: user.email,
      name: user.name,
      resetUrl,
    });
    logger.info('Password reset event published.', {
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    logger.warn('RabbitMQ publish failed for password.reset. Sending email directly.', {
      userId: user.id,
      email: user.email,
      error: err.message,
    });

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken });
      logger.info('Password reset email sent directly.', {
        userId: user.id,
        email: user.email,
      });
    } catch (emailErr) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      logger.error('Failed to send password reset email.', {
        userId: user.id,
        email: user.email,
        error: emailErr.message,
      });
      return res.status(500).json({ success: false, message: 'Failed to send reset email.' });
    }
  }

  res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.scope('withSecrets').findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    logger.warn('Invalid or expired password reset token.', {
      token: req.params.token,
    });
    return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
  }

  user.password = req.body.password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = [];
  await user.save();

  logger.info('Password reset successfully.', {
    userId: user.id,
  });

  res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeJSON() });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope('withSecrets').findByPk(req.user.id);
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    logger.warn('Incorrect current password during change password.', {
      userId: req.user.id,
    });
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  logger.info('User password changed.', {
    userId: user.id,
  });

  res.status(200).json({ success: true, message: 'Password changed successfully.' });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    logger.warn('Delete account attempted without password.', {
      userId: req.user.id,
    });
    return res.status(400).json({ success: false, message: 'Password is required to delete account.' });
  }

  const user = await User.scope('withSecrets').findByPk(req.user.id);
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    logger.warn('Incorrect password provided for account deletion.', {
      userId: req.user.id,
    });
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }

  const userId = user.id;
  await deleteProfileRemote(userId);
  await user.destroy();

  logger.info('User account deleted.', {
    userId,
  });

  res.clearCookie('refreshToken').status(200).json({ success: true, message: 'Account deleted successfully.' });
});

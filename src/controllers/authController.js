const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendTokenResponse } = require('../utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use.' });
  }

  const user = await User.create({ name, email, password });

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ to: email, name }).catch(console.error);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
  await user.save();

  sendTokenResponse(res, 201, user.toSafeJSON(), accessToken, refreshToken);
});

// POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // withSecrets scope includes the password column
  const user = await User.scope('withSecrets').findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const tokens = [...(user.refreshTokens || []), { token: refreshToken, createdAt: new Date() }];
  user.refreshTokens = tokens.slice(-5); // keep latest 5
  await user.save();

  sendTokenResponse(res, 200, user.toSafeJSON(), accessToken, refreshToken);
});

// POST /api/v1/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    const user = await User.scope('withSecrets').findByPk(req.user.id);
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
      await user.save();
    }
  }

  res.clearCookie('refreshToken').status(200).json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/v1/auth/refresh-token
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  const user = await User.scope('withSecrets').findByPk(decoded.id);
  if (!user || !(user.refreshTokens || []).some((t) => t.token === token)) {
    return res.status(401).json({ success: false, message: 'Refresh token not recognised.' });
  }

  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((t) => t.token !== token),
    { token: newRefreshToken, createdAt: new Date() },
  ];
  await user.save();

  sendTokenResponse(res, 200, user.toSafeJSON(), newAccessToken, newRefreshToken);
});

// POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.scope('withSecrets').findOne({ where: { email: req.body.email } });

  // Always 200 — prevents email enumeration
  if (!user) {
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken });
  } catch {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.status(500).json({ success: false, message: 'Failed to send reset email.' });
  }

  res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// PATCH /api/v1/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.scope('withSecrets').findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
  }

  user.password = req.body.password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
});

// GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

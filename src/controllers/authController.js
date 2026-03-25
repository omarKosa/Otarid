const crypto = require('crypto');
const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../Otarid/src/models/User');
const GoogleUser = require('../models/GoogleUser');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendTokenResponse } = require('../../Otarid/src/utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../../Otarid/src/utils/email');
const { asyncHandler } = require('../../Otarid/src/middleware/errorHandler');
const logger = require('../../Otarid/src/utils/logger');

// POST /api/v1/auth/register
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

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ to: email, name }).catch((err) => {
    logger.warn('Failed to send welcome email.', {
      email,
      error: err.message,
    });
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
  await user.save();

  logger.info('User registered successfully.', {
    userId: user.id,
    email: user.email,
  });

  sendTokenResponse(res, 201, user.toSafeJSON(), accessToken, refreshToken);
});

// POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // withSecrets scope includes the password column
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

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const tokens = [...(user.refreshTokens || []), { token: refreshToken, createdAt: new Date() }];
  user.refreshTokens = tokens.slice(-5); // keep latest 5
  await user.save();

  logger.info('User login successful.', {
    userId: user.id,
    email: user.email,
  });

  sendTokenResponse(res, 200, user.toSafeJSON(), accessToken, refreshToken);
});

// POST /api/v1/auth/google
exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '387721482715-38qo7e5qve8c2d4t6kd8vup2m6fde9a9.apps.googleusercontent.com');
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: client._clientId,
  });
  const payload = ticket.getPayload();

  const { sub: googleId, email, name, picture } = payload;

  // Check if Google user exists
  let googleUser = await GoogleUser.findOne({ where: { googleId } });

  if (googleUser) {
    // Google user exists, get the associated User
    const user = await User.findByPk(googleUser.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const tokens = [...(user.refreshTokens || []), { token: refreshToken, createdAt: new Date() }];
    user.refreshTokens = tokens.slice(-5);
    await user.save();

    logger.info('Google user login successful.', {
      userId: user.id,
      email: user.email,
    });

    return sendTokenResponse(res, 200, user.toSafeJSON(), accessToken, refreshToken);
  }

  // Check if email already exists in User table
  let user = await User.findOne({ where: { email } });

  if (!user) {
    // Create new User
    user = await User.create({
      name,
      email,
      password: crypto.randomBytes(32).toString('hex'), // random password since Google login
    });
  }

  // Create GoogleUser linked to User
  googleUser = await GoogleUser.create({
    googleId,
    email,
    name,
    picture,
    userId: user.id,
  });

  // Send welcome email if new user
  if (user.createdAt.getTime() === user.updatedAt.getTime()) {
    sendWelcomeEmail({ to: email, name }).catch((err) => {
      logger.warn('Failed to send welcome email.', {
        email,
        error: err.message,
      });
    });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
  await user.save();

  logger.info('Google user registered and logged in.', {
    userId: user.id,
    email: user.email,
  });

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
      logger.info('User logged out.', {
        userId: user.id,
      });
    }
  }

  res.clearCookie('refreshToken').status(200).json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/v1/auth/refresh-token
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

  const newAccessToken = generateAccessToken(user.id);
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

// POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.scope('withSecrets').findOne({ where: { email: req.body.email } });

  // Always 200 — prevents email enumeration
  if (!user) {
    logger.info('Password reset requested for non-existing email.', {
      email: req.body.email,
      ip: req.ip,
    });
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken });
    logger.info('Password reset email sent.', {
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    logger.error('Failed to send password reset email.', {
      userId: user.id,
      email: user.email,
      error: err.message,
    });
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
    logger.warn('Invalid or expired password reset token.', {
      token: req.params.token,
    });
    return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
  }

  user.password = req.body.password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();

  logger.info('Password reset successfully.', {
    userId: user.id,
  });

  res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
});

// GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

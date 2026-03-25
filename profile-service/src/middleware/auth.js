const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn('Access denied. No token provided.', {
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = verifyAccessToken(token);

    // Use default scope (no password/tokens returned)
    const user = await User.findByPk(decoded.id);

    if (!user) {
      logger.warn('Authenticated user no longer exists.', {
        userId: decoded.id,
        path: req.originalUrl,
      });
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted access.', {
        userId: user.id,
        path: req.originalUrl,
      });
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      logger.warn('User token invalidated due to password change.', {
        userId: user.id,
        path: req.originalUrl,
      });
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please log in again.',
      });
    }

    req.user = user;
    logger.debug('Authenticated request', {
      userId: user.id,
      path: req.originalUrl,
      method: req.method,
    });
    next();
  } catch (error) {
    logger.warn('JWT verification failed', {
      name: error.name,
      message: error.message,
      path: req.originalUrl,
    });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to do this.' });
  }
  next();
};

module.exports = { protect, restrictTo };

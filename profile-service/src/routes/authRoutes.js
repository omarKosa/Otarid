const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { register, login, logout, refreshToken, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerRules, loginRules, forgotPasswordRules, resetPasswordRules } = require('../middleware/validators');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
});

// Public
router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordLimiter, forgotPasswordRules, validate, forgotPassword);
router.patch('/reset-password/:token', passwordLimiter, resetPasswordRules, validate, resetPassword);

// Protected
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;

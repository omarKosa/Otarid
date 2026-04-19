const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
} = require('../middleware/validators');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    const retryAfterSeconds = req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 900;
    res.status(429).json({ 
      success: false, 
      message: 'Too many login/registration attempts.',
      retryAfterSeconds: retryAfterSeconds,
      retryAt: new Date(req.rateLimit.resetTime || Date.now() + 15 * 60 * 1000).toISOString(),
    });
  },
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    const retryAfterSeconds = req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 3600;
    res.status(429).json({ 
      success: false, 
      message: 'Too many password reset attempts. Please try again later.',
      retryAfterSeconds: retryAfterSeconds,
      retryAt: new Date(req.rateLimit.resetTime || Date.now() + 60 * 60 * 1000).toISOString(),
    });
  },
});

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordLimiter, forgotPasswordRules, validate, forgotPassword);
router.patch('/reset-password/:token', passwordLimiter, resetPasswordRules, validate, resetPassword);

router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/change-password', changePasswordRules, validate, changePassword);
router.delete('/delete-account', deleteAccount);

module.exports = router;

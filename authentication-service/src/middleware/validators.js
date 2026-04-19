const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({
      success: false,
      message: 'Request validation failed. Please check the errors field for details.',
      errors: errorMessages,
    });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').trim().isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Provide a valid email').normalizeEmail(),
];

const resetPasswordRules = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
};

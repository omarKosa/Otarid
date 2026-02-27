const { body, validationResult } = require('express-validator');

// Run this after any rule set to catch errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
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

const updateProfileRules = [
  body('name').optional().trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('bio').optional().isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters'),
  body('email').optional().trim().isEmail().withMessage('Provide a valid email').normalizeEmail(),
];

module.exports = { validate, registerRules, loginRules, forgotPasswordRules, resetPasswordRules, updateProfileRules };

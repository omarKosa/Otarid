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

const updateProfileRules = [
  body('name').optional().trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('bio').optional().isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters'),
  body('email').optional().trim().isEmail().withMessage('Provide a valid email').normalizeEmail(),
];

module.exports = { validate, updateProfileRules };

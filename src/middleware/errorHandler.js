const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Sequelize unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    message = err.errors.map((e) => e.message).join(', ');
    statusCode = 400;
  }

  // Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    message = 'Database error occurred.';
    statusCode = 500;
  }

  // Multer file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large. Maximum size is 5MB.';
    statusCode = 400;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Wraps async route handlers so you don't need try/catch everywhere
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

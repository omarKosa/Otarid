const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  if (err.name === 'SequelizeValidationError') {
    message = err.errors.map((e) => e.message).join(', ');
    statusCode = 400;
  }

  if (err.name === 'SequelizeDatabaseError') {
    message = 'Database error occurred.';
    statusCode = 500;
  }

  logger.error('Request error handled', {
    statusCode,
    message,
    name: err.name,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

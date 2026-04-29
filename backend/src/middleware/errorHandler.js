'use strict';

const logger          = require('../config/logger');
const { StatusCodes } = require('http-status-codes');
const { ApiError }    = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Known API errors
  if (err instanceof ApiError) {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${err.statusCode}: ${err.message}`);
    return res.status(err.statusCode).json({
      success:   false,
      message:   err.message,
      errors:    err.errors,
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success:   false,
      message:   'Invalid token',
      timestamp: new Date().toISOString(),
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success:   false,
      message:   'Token expired',
      timestamp: new Date().toISOString(),
    });
  }

  // Validation errors (express-validator pass-through)
  if (err.type === 'validation') {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success:   false,
      message:   'Validation failed',
      errors:    err.errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic / unhandled
  logger.error(`[${req.method}] ${req.originalUrl} — Unhandled: ${err.message}`, err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success:   false,
    message:   'An unexpected error occurred. Please try again.',
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;

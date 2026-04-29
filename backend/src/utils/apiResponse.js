'use strict';

const { StatusCodes } = require('http-status-codes');

// ── Custom API Error ─────────────────────────────────────────────────────────
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name       = 'ApiError';
    this.statusCode = statusCode;
    this.errors     = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, errors)   { return new ApiError(StatusCodes.BAD_REQUEST,           msg, errors); }
  static unauthorized(msg)         { return new ApiError(StatusCodes.UNAUTHORIZED,           msg || 'Unauthorized'); }
  static forbidden(msg)            { return new ApiError(StatusCodes.FORBIDDEN,              msg || 'Forbidden'); }
  static notFound(msg)             { return new ApiError(StatusCodes.NOT_FOUND,              msg || 'Not found'); }
  static conflict(msg)             { return new ApiError(StatusCodes.CONFLICT,               msg); }
  static unprocessable(msg,errors) { return new ApiError(StatusCodes.UNPROCESSABLE_ENTITY,  msg, errors); }
  static internal(msg)             { return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR,  msg || 'Internal server error'); }
}

// ── Standard API Response helpers ────────────────────────────────────────────
const sendSuccess = (res, data = {}, message = 'Success', statusCode = StatusCodes.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const sendCreated = (res, data = {}, message = 'Created successfully') => {
  return sendSuccess(res, data, message, StatusCodes.CREATED);
};

const sendPaginated = (res, data = [], total = 0, page = 1, limit = 20) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
      hasPrev:    page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = { ApiError, sendSuccess, sendCreated, sendPaginated };

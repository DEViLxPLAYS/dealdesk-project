'use strict';

const { validationResult } = require('express-validator');
const { ApiError }         = require('../utils/apiResponse');

/**
 * Drop this after any express-validator chain.
 * If there are errors it throws a formatted ApiError; otherwise calls next().
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    throw ApiError.badRequest('Validation failed', formatted);
  }
  next();
};

module.exports = validate;

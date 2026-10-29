const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Login lives in booking-api, so pos-api only needs a general limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (req, res, next) => next(new ApiError(429, 'Too many requests, please slow down')),
});

module.exports = { apiLimiter };

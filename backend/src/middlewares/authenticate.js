const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

// Tokens are issued by booking-api; pos-api only verifies them with the shared secret
const toUser = (payload) => ({ id: payload.sub, role: payload.role, name: payload.name });

const authenticate = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized('Access token is missing'));

  try {
    req.user = toUser(jwt.verify(token, env.JWT_ACCESS_SECRET));
    return next();
  } catch {
    return next(ApiError.unauthorized('Access token is invalid or expired'));
  }
};

// Attach req.user when a valid token exists, otherwise continue as a guest
const optionalAuthenticate = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = toUser(jwt.verify(token, env.JWT_ACCESS_SECRET));
  } catch {
    req.user = undefined;
  }
  return next();
};

module.exports = { authenticate, optionalAuthenticate };

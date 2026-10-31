const jwt = require('jsonwebtoken');
const { createRemoteJWKSet, jwtVerify, decodeProtectedHeader } = require('jose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

// KandangID public keys are fetched once and cached; a new kid after key rotation triggers a reload
const ssoKeys = env.SSO_JWKS_URL ? createRemoteJWKSet(new URL(env.SSO_JWKS_URL)) : null;

// Two token sources during the move to single sign-on:
// HS256 from booking-api (shared secret) and RS256 from KandangID (public key, no secret here)
const verifyToken = async (token) => {
  const { alg } = decodeProtectedHeader(token);
  if (alg === 'RS256') {
    if (!ssoKeys) throw new Error('Single sign-on is not configured');
    const { payload } = await jwtVerify(token, ssoKeys, { issuer: env.SSO_ISSUER, audience: env.SSO_AUDIENCE, algorithms: ['RS256'] });
    return payload;
  }
  // Pinning the algorithm stops a forged token from choosing how it is checked
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
};

const toUser = (payload) => ({ id: payload.sub, role: payload.role, name: payload.name });

const authenticate = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized('Access token is missing'));

  try {
    req.user = toUser(await verifyToken(token));
    return next();
  } catch {
    return next(ApiError.unauthorized('Access token is invalid or expired'));
  }
};

// Attach req.user when a valid token exists, otherwise continue as a guest
const optionalAuthenticate = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = toUser(await verifyToken(token));
  } catch {
    req.user = undefined;
  }
  return next();
};

module.exports = { authenticate, optionalAuthenticate };

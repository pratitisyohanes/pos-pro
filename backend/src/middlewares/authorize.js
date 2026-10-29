const ApiError = require('../utils/ApiError');

// Allow the request only when req.user has one of the given roles
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };

module.exports = authorize;

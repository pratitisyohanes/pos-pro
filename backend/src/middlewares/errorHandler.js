const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require('sequelize');
const { ZodError } = require('zod');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { formatIssues } = require('./validate');

// Translate known library errors into ApiError instances
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) return new ApiError(422, 'Validation failed', formatIssues(err.issues));
  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Request body is not valid JSON');

  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {}).join(', ');
    return ApiError.conflict(`A record with the same ${fields || 'value'} already exists`);
  }
  if (err instanceof ForeignKeyConstraintError) return ApiError.conflict('Operation violates a relation between records');
  if (err instanceof ValidationError) {
    return new ApiError(422, 'Validation failed', err.errors.map((e) => ({ field: e.path, message: e.message })));
  }
  return null;
};

// Last middleware in the chain; Express needs all four arguments to treat it as an error handler
const errorHandler = (err, req, res, next) => {
  const apiError = normalizeError(err);

  if (!apiError) {
    console.error(err);
    const body = { success: false, message: 'Internal server error' };
    if (env.NODE_ENV === 'development') body.detail = err.message;
    return res.status(500).json(body);
  }

  const body = { success: false, message: apiError.message };
  if (apiError.errors) body.errors = apiError.errors;
  return res.status(apiError.statusCode).json(body);
};

module.exports = errorHandler;

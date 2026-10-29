const { z } = require('zod');

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Date is not valid');

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm format');

const idParam = z.object({ id: z.coerce.number().int().positive('Id must be a positive number') });

const uuidParam = (name = 'id') => z.object({ [name]: z.string().uuid('Id must be a valid UUID') });

const paginationQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(50).optional(),
};

const dateRangeQuery = {
  from: dateString.optional(),
  to: dateString.optional(),
  period: z.enum(['today', 'this_week', 'this_month']).optional(),
};

const searchQuery = z.string().trim().max(100).optional();

const atLeastOneField = (schema) =>
  schema.refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

module.exports = {
  dateString,
  timeString,
  idParam,
  uuidParam,
  paginationQuery,
  dateRangeQuery,
  searchQuery,
  atLeastOneField,
};

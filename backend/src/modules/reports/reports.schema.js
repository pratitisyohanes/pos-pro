const { z } = require('zod');
const { dateRangeQuery } = require('../../utils/commonSchemas');

const rangeQuery = z.object({ ...dateRangeQuery });

const summarySchema = z.object({ query: rangeQuery });

const topListSchema = z.object({
  query: rangeQuery.extend({ limit: z.coerce.number().int().min(1).max(50).default(5) }),
});

const lowStockSchema = z.object({
  query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(10) }),
});

const salesSchema = z.object({
  query: rangeQuery.extend({ groupBy: z.enum(['day', 'month']).default('day') }),
});

const exportSchema = z.object({
  query: rangeQuery.extend({
    type: z.enum(['transactions', 'top-products']).default('transactions'),
    format: z.enum(['csv']).default('csv'),
  }),
});

module.exports = { summarySchema, topListSchema, lowStockSchema, salesSchema, exportSchema };

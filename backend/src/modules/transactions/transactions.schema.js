const { z } = require('zod');
const { uuidParam, paginationQuery, dateRangeQuery, searchQuery } = require('../../utils/commonSchemas');

const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'EWALLET'];

const bookingCode = z
  .string()
  .trim()
  .max(30)
  .regex(/^BK-[A-Za-z0-9-]+$/i, 'Booking code must look like BK-20261022-7F3A9C')
  .transform((value) => value.toUpperCase());

const lineItem = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(999),
});

const cashierSaleSchema = z.object({
  body: z
    .object({
      items: z.array(lineItem).max(50).default([]),
      bookingCode: bookingCode.optional(),
      customerName: z.string().trim().max(100).optional(),
      paymentMethod: z.enum(PAYMENT_METHODS),
      paidAmount: z.coerce.number().min(0).optional(),
      note: z.string().trim().max(255).optional(),
    })
    .refine((data) => data.items.length > 0 || data.bookingCode, { message: 'Add at least one product or a booking', path: ['items'] }),
});

const selfOrderSchema = z.object({
  body: z.object({
    items: z.array(lineItem).min(1, 'Your cart is empty').max(50),
    note: z.string().trim().max(255).optional(),
  }),
});

const transactionIdSchema = z.object({ params: uuidParam() });

const payTransactionSchema = z.object({
  params: uuidParam(),
  body: z.object({
    paymentMethod: z.enum(PAYMENT_METHODS),
    paidAmount: z.coerce.number().min(0).optional(),
  }),
});

const cancelTransactionSchema = z.object({
  params: uuidParam(),
  body: z.object({ reason: z.string().trim().max(255).optional() }).default({}),
});

const listQuery = {
  ...paginationQuery,
  ...dateRangeQuery,
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
};

const listMyTransactionsSchema = z.object({ query: z.object(listQuery) });

const listTransactionsSchema = z.object({
  query: z.object({ ...listQuery, channel: z.enum(['CASHIER', 'SELF_ORDER']).optional(), search: searchQuery }),
});

const bookingCodeSchema = z.object({ params: z.object({ code: bookingCode }) });

module.exports = {
  cashierSaleSchema,
  selfOrderSchema,
  transactionIdSchema,
  payTransactionSchema,
  cancelTransactionSchema,
  listMyTransactionsSchema,
  listTransactionsSchema,
  bookingCodeSchema,
};

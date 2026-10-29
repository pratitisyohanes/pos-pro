const { z } = require('zod');
const { idParam, paginationQuery, dateRangeQuery, searchQuery, atLeastOneField } = require('../../utils/commonSchemas');
const { UNITS } = require('../../models/product');

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');

const productFields = {
  categoryId: z.coerce.number().int().positive('Category is required'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,40}$/, 'SKU must be 3-40 letters, numbers or dashes'),
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  description: z.string().trim().max(2000).optional(),
  unit: z.enum(UNITS),
  price: z.coerce.number().positive('Price must be greater than 0').max(1000000000),
  minStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative').max(100000),
  installServiceId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  imageUrl: z.string().trim().url('Image URL is not valid').or(z.literal('')).optional(),
};

const listProductsSchema = z.object({
  query: z.object({
    ...paginationQuery,
    search: searchQuery,
    categoryId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    lowStock: booleanQuery.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
  }),
});

const productIdSchema = z.object({ params: idParam });

const createProductSchema = z.object({
  body: z.object({
    ...productFields,
    // Opening stock is written to stock_movements as a RESTOCK
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(100000).default(0),
  }),
});

const updateProductSchema = z.object({
  params: idParam,
  body: atLeastOneField(z.object(productFields).partial()),
});

const adjustStockSchema = z.object({
  params: idParam,
  body: z
    .object({
      type: z.enum(['RESTOCK', 'ADJUST']),
      quantity: z.coerce.number().int().refine((value) => value !== 0, 'Quantity cannot be 0'),
      note: z.string().trim().max(255).optional(),
    })
    .refine((data) => data.type !== 'RESTOCK' || data.quantity > 0, { message: 'Restock quantity must be positive', path: ['quantity'] }),
});

const listMovementsSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }).partial(),
  query: z.object({
    ...paginationQuery,
    ...dateRangeQuery,
    productId: z.coerce.number().int().positive().optional(),
    type: z.enum(['SALE', 'CANCEL', 'RESTOCK', 'ADJUST']).optional(),
  }),
});

module.exports = {
  listProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  listMovementsSchema,
};

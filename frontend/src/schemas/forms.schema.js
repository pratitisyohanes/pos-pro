import { z } from 'zod';

// Same rules as the backend Zod schemas so errors appear before the request
export const loginSchema = z.object({
  email: z.string().trim().email('Email is not valid'),
  password: z.string().min(1, 'Password is required'),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

export const productSchema = z.object({
  categoryId: z.coerce.number({ invalid_type_error: 'Category is required' }).int().positive('Category is required'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,40}$/, 'SKU must be 3-40 letters, numbers or dashes'),
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  description: z.string().trim().max(2000),
  unit: z.enum(['UNIT', 'PCS', 'SET', 'SACK', 'BOTTLE']),
  price: z.coerce.number().positive('Price must be greater than 0').max(1000000000),
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(100000),
  minStock: z.coerce.number().int('Minimum stock must be a whole number').min(0, 'Minimum stock cannot be negative').max(100000),
  installServiceId: z.union([z.literal(''), z.coerce.number().int().positive('Service id must be positive')]),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  imageUrl: z.string().trim().url('Image URL is not valid').or(z.literal('')),
});

export const stockSchema = z
  .object({
    type: z.enum(['RESTOCK', 'ADJUST']),
    quantity: z.coerce.number().int('Quantity must be a whole number').refine((value) => value !== 0, 'Quantity cannot be 0'),
    note: z.string().trim().max(255),
  })
  .refine((data) => data.type !== 'RESTOCK' || data.quantity > 0, { message: 'Restock quantity must be positive', path: ['quantity'] });

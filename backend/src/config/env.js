require('dotenv').config();
const { z } = require('zod');
const applyDatabaseUrl = require('./databaseUrl');

applyDatabaseUrl();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),
  DATABASE_URL: z.string().min(1, 'Set DATABASE_URL or DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD'),
  DB_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  // Must equal JWT_ACCESS_SECRET of booking-api, which issues every token
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  BOOKING_API_URL: z.string().url('BOOKING_API_URL must be a URL like http://127.0.0.1:5000/api/v1'),
  // Must equal INTERNAL_API_KEY of booking-api
  INTERNAL_API_KEY: z.string().min(32, 'INTERNAL_API_KEY must be at least 32 characters'),
  BOOKING_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),

  // Single sign-on (KandangID, sso-pro): RS256 tokens are checked with the public keys at this URL; leave empty to accept only HS256
  SSO_JWKS_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  SSO_ISSUER: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  // This API's name in the token "aud" claim
  SSO_AUDIENCE: z.string().default('pos-api'),
});

const requireTogether = (data, ctx) => {
  if (data.SSO_JWKS_URL && !data.SSO_ISSUER) {
    ctx.addIssue({ code: 'custom', path: ['SSO_ISSUER'], message: 'SSO_ISSUER is required when SSO_JWKS_URL is set' });
  }
};

// Fail fast on startup when required environment variables are missing
const parsed = envSchema.superRefine(requireTogether).safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = {
  ...parsed.data,
  BOOKING_API_URL: parsed.data.BOOKING_API_URL.replace(/\/+$/, ''),
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
};

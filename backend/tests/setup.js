// Test environment values; tests below never touch the database or booking-api
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-1234567890';
process.env.BOOKING_API_URL = 'http://127.0.0.1:5999/api/v1';
process.env.INTERNAL_API_KEY = 'test-internal-key-0123456789abcdef0123';
process.env.BOOKING_TIMEOUT_MS = '500';
// tests/integration/sso.test.js serves a JWKS on this port with its own test key
process.env.SSO_JWKS_URL = 'http://127.0.0.1:5996/.well-known/jwks.json';
process.env.SSO_ISSUER = 'http://localhost:5002';

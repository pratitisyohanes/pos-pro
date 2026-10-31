const http = require('http');
const crypto = require('crypto');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { SignJWT, exportJWK } = require('jose');
const app = require('../../src/app');

// A stand-in KandangID: its own key pair and a JWKS endpoint on the port from tests/setup.js
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
let server;

beforeAll(async () => {
  const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: 'test-kid', alg: 'RS256', use: 'sig' }] };
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jwks));
  });
  await new Promise((resolve) => server.listen(5996, '127.0.0.1', resolve));
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const ssoToken = ({ role = 'USER', audience = ['booking-api', 'pos-api'], issuer = 'http://localhost:5002', key = privateKey } = {}) =>
  new SignJWT({ role, name: 'Budi Santoso', email: 'budi@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuer(issuer)
    .setSubject('0a000000-0000-4000-8000-000000000002')
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);

describe('KandangID tokens in pos-api', () => {
  test('an RS256 token from KandangID is accepted and carries the role', async () => {
    const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${await ssoToken()}`);
    // 403 means the token was accepted and the USER role was read from it
    expect(res.status).toBe(403);
  });

  test('admin token passes authorization and reaches validation', async () => {
    const res = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${await ssoToken({ role: 'ADMIN' })}`).send({});
    expect(res.status).toBe(422);
  });

  test('a token meant for another API is refused', async () => {
    const res = await request(app).get('/api/v1/transactions/me').set('Authorization', `Bearer ${await ssoToken({ audience: 'booking-api' })}`);
    expect(res.status).toBe(401);
  });

  test('a token from another issuer is refused', async () => {
    const res = await request(app).get('/api/v1/transactions/me').set('Authorization', `Bearer ${await ssoToken({ issuer: 'https://evil.example' })}`);
    expect(res.status).toBe(401);
  });

  test('a token signed with an unknown key is refused', async () => {
    const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const res = await request(app).get('/api/v1/transactions/me').set('Authorization', `Bearer ${await ssoToken({ key: other })}`);
    expect(res.status).toBe(401);
  });

  test('an HS256 token signed with the public key as secret is refused (algorithm confusion)', async () => {
    const pem = publicKey.export({ type: 'spki', format: 'pem' });
    const forged = jwt.sign({ sub: 'x', role: 'ADMIN' }, pem, { algorithm: 'HS256' });
    const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('old HS256 tokens from booking-api still work during the move', async () => {
    const legacy = jwt.sign({ sub: 'u1', role: 'USER', name: 'Budi' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
    const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${legacy}`);
    expect(res.status).toBe(403);
  });
});

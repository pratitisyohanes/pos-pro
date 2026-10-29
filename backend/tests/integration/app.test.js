const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

// Tokens are signed the same way booking-api signs them
const sign = (role) =>
  jwt.sign({ sub: '0a000000-0000-4000-8000-000000000001', role, name: `${role} demo` }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });

const userToken = sign('USER');
const adminToken = sign('ADMIN');

// These requests are rejected by middleware before any database query runs
describe('request pipeline', () => {
  test('GET /health and /api/v1/health return OK', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/api/v1/health')).status).toBe(200);
  });

  test('unknown route returns 404 envelope', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });

  test('protected route without token returns 401', async () => {
    const res = await request(app).get('/api/v1/transactions/me');
    expect(res.status).toBe(401);
  });

  test('token signed with another secret returns 401', async () => {
    const forged = jwt.sign({ sub: 'x', role: 'ADMIN' }, 'another-secret-1234567890');
    const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('customer cannot open admin reports', async () => {
    const res = await request(app).get('/api/v1/reports/summary').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('admin cannot place a self-order', async () => {
    const res = await request(app).post('/api/v1/transactions/self-order').set('Authorization', `Bearer ${adminToken}`).send({ items: [{ productId: 1, quantity: 1 }] });
    expect(res.status).toBe(403);
  });

  test('cashier sale needs a product or a booking', async () => {
    const res = await request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${adminToken}`).send({ paymentMethod: 'CASH' });
    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.field)).toContain('items');
  });

  test('invalid booking code is rejected before calling booking-api', async () => {
    const res = await request(app).get('/api/v1/bookings/not-a-code').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(422);
  });

  test('restock quantity must be positive', async () => {
    const res = await request(app).post('/api/v1/products/1/stock').set('Authorization', `Bearer ${adminToken}`).send({ type: 'RESTOCK', quantity: -3 });
    expect(res.status).toBe(422);
  });

  test('swagger spec is served', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.info.title).toBe('Layer Farm POS API');
  });
});

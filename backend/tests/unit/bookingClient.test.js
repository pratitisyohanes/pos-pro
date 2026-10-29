const bookingClient = require('../../src/clients/bookingClient');

const respond = (status, body) => jest.spyOn(global, 'fetch').mockResolvedValue({ ok: status < 400, status, json: async () => body });

afterEach(() => jest.restoreAllMocks());

describe('booking client', () => {
  test('sends the service key and returns data', async () => {
    const fetchMock = respond(200, { success: true, data: { bookingCode: 'BK-SEED-0009' } });
    await expect(bookingClient.getBooking('BK-SEED-0009')).resolves.toEqual({ bookingCode: 'BK-SEED-0009' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://127.0.0.1:5999/api/v1/internal/bookings/BK-SEED-0009');
    expect(options.headers['X-Internal-Key']).toBe(process.env.INTERNAL_API_KEY);
  });

  test('maps 404 to not found', async () => {
    respond(404, { message: 'Booking BK-X not found' });
    await expect(bookingClient.getBooking('BK-X')).rejects.toMatchObject({ statusCode: 404, message: 'Booking BK-X not found' });
  });

  test('maps business errors to 409 with the booking-api message', async () => {
    respond(409, { message: 'Booking BK-SEED-0001 is already paid' });
    await expect(bookingClient.settleBooking('BK-SEED-0001', { method: 'CASH', amount: 1, externalRef: 'INV-1' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Booking BK-SEED-0001 is already paid',
    });
  });

  test('maps a wrong service key to 502', async () => {
    respond(401, { message: 'Invalid service key' });
    await expect(bookingClient.getBooking('BK-SEED-0001')).rejects.toMatchObject({ statusCode: 502 });
  });

  test('maps a network failure to 502', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(bookingClient.getBooking('BK-SEED-0001')).rejects.toMatchObject({ statusCode: 502 });
  });
});

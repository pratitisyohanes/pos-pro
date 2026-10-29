const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Call booking-api /internal routes with the shared service key
const request = async (path, { method = 'GET', body, query } = {}) => {
  const url = new URL(`${env.BOOKING_API_URL}/internal${path}`);
  Object.entries(query || {}).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, value));

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': env.INTERNAL_API_KEY },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(env.BOOKING_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(502, 'Booking system is not responding, please try again');
  }

  const payload = await response.json().catch(() => ({}));
  if (response.ok) return payload.data;

  // Business errors from booking-api are passed on; auth or server errors mean a setup problem
  if (response.status === 404) throw ApiError.notFound(payload.message || 'Booking not found');
  if ([400, 409, 422].includes(response.status)) throw ApiError.conflict(payload.message || 'Booking cannot be processed');
  throw new ApiError(502, 'Booking system rejected the request, check INTERNAL_API_KEY and BOOKING_API_URL');
};

const getBooking = (code) => request(`/bookings/${encodeURIComponent(code)}`);

const settleBooking = (code, { method, amount, externalRef }) =>
  request(`/bookings/${encodeURIComponent(code)}/settle`, { method: 'POST', body: { method, amount, externalRef } });

const getSummary = (query) => request('/reports/summary', { query });

module.exports = { getBooking, settleBooking, getSummary };

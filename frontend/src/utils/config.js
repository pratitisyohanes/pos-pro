// Values baked in at build time from .env (see .env.example)
export const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/auth';
export const BOOKING_URL = (import.meta.env.VITE_BOOKING_URL || 'http://localhost:5173').replace(/\/+$/, '');

export const bookingServiceUrl = (serviceId) => `${BOOKING_URL}/services/${serviceId}`;

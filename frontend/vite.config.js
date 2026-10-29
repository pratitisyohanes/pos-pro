import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const posApi = env.DEV_POS_API_TARGET || 'http://localhost:5001';
  const bookingApi = env.DEV_BOOKING_API_TARGET || 'http://localhost:5000';

  // Same relative paths as production Nginx: /api goes to pos-api, /auth goes to booking-api
  const proxy = {
    '/api': posApi,
    '/auth': { target: bookingApi, rewrite: (path) => path.replace(/^\/auth/, '/api/v1/auth') },
  };

  return {
    plugins: [react()],
    server: { port: 5174, proxy },
    preview: { port: 4174, proxy },
  };
});

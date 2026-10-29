import { authHttp, getData } from './client';

// Accounts live in booking-api; these calls go through the /auth proxy
export const authApi = {
  login: (payload) => authHttp.post('/login', payload, { skipAuthRefresh: true }).then(getData),
  logout: (refreshToken) => authHttp.post('/logout', { refreshToken }),
  getMe: () => authHttp.get('/me').then(getData),
};

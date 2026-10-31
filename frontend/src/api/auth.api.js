import { authHttp, getData } from './client';

// Accounts live in booking-api; these calls go through the /auth proxy
export const authApi = {
  login: (payload) => authHttp.post('/login', payload, { skipAuthRefresh: true }).then(getData),
  // Second login step for accounts with two-factor authentication; a 401 here means the ticket expired
  mfaVerify: (payload) => authHttp.post('/mfa/verify', payload, { skipAuthRefresh: true }).then(getData),
  mfaSetup: (payload) => authHttp.post('/mfa/setup', payload, { skipAuthRefresh: true }).then(getData),
  mfaEnable: (payload) => authHttp.post('/mfa/enable', payload, { skipAuthRefresh: true }).then(getData),
  logout: (refreshToken) => authHttp.post('/logout', { refreshToken }),
  getMe: () => authHttp.get('/me').then(getData),
};

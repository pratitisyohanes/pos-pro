import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL, AUTH_URL } from '../utils/config';
import { isSsoEnabled, refreshWithSso } from '../utils/oidc';

// pos-api for products and sales, booking-api (through /auth) for login and tokens
export const api = axios.create({ baseURL: API_URL });
export const authHttp = axios.create({ baseURL: AUTH_URL });

// Separate instance without interceptors so a failed refresh cannot trigger another refresh
const refreshClient = axios.create({ baseURL: AUTH_URL });

// Unwrap the backend envelope { success, message, data, meta }
export const getData = (response) => response.data.data;
export const getList = (response) => ({ items: response.data.data, meta: response.data.meta });

let refreshPromise = null;

// Parallel 401 responses share one refresh call because booking-api rotates refresh tokens
export const refreshSession = () => {
  const { refreshToken, setSession } = useAuthStore.getState();
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  if (!refreshPromise) {
    // With single sign-on the token pair comes from KandangID, otherwise from booking-api through /auth
    const request = isSsoEnabled ? refreshWithSso(refreshToken) : refreshClient.post('/refresh', { refreshToken }).then(getData);
    refreshPromise = request
      .then((session) => {
        setSession(session);
        return session.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const attachToken = (config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
};

// Retry once with a fresh token; login requests opt out with skipAuthRefresh
const retryWithRefresh = (instance) => async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || !original || original._retry || original.skipAuthRefresh) {
    return Promise.reject(error);
  }

  original._retry = true;
  try {
    const accessToken = await refreshSession();
    original.headers.Authorization = `Bearer ${accessToken}`;
    return instance(original);
  } catch {
    useAuthStore.getState().clearSession();
    return Promise.reject(error);
  }
};

[api, authHttp].forEach((instance) => {
  instance.interceptors.request.use(attachToken);
  instance.interceptors.response.use((response) => response, retryWithRefresh(instance));
});

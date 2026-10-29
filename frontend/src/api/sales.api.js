import { api, getData, getList } from './client';

export const transactionsApi = {
  checkout: (payload) => api.post('/transactions', payload).then(getData),
  selfOrder: (payload) => api.post('/transactions/self-order', payload).then(getData),
  listMine: (params) => api.get('/transactions/me', { params }).then(getList),
  listAll: (params) => api.get('/transactions', { params }).then(getList),
  getById: (id) => api.get(`/transactions/${id}`).then(getData),
  pay: (id, payload) => api.patch(`/transactions/${id}/pay`, payload).then(getData),
  cancel: (id, reason) => api.patch(`/transactions/${id}/cancel`, { reason }).then(getData),
};

export const bookingsApi = {
  lookup: (code) => api.get(`/bookings/${encodeURIComponent(code.trim())}`).then(getData),
};

export const reportsApi = {
  summary: (params) => api.get('/reports/summary', { params }).then(getData),
  topProducts: (params) => api.get('/reports/top-products', { params }).then(getData),
  lowStock: (params) => api.get('/reports/low-stock', { params }).then(getData),
  sales: (params) => api.get('/reports/sales', { params }).then(getData),
  bookingSummary: (params) => api.get('/reports/booking-summary', { params }).then(getData),
  // CSV export needs the auth header, so it is fetched as a blob instead of a plain link
  exportCsv: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

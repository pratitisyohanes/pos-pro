import { api, getData, getList } from './client';

export const categoriesApi = {
  list: (params) => api.get('/categories', { params }).then(getList),
  create: (payload) => api.post('/categories', payload).then(getData),
  update: (id, payload) => api.patch(`/categories/${id}`, payload).then(getData),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const productsApi = {
  list: (params) => api.get('/products', { params }).then(getList),
  getById: (id) => api.get(`/products/${id}`).then(getData),
  create: (payload) => api.post('/products', payload).then(getData),
  update: (id, payload) => api.patch(`/products/${id}`, payload).then(getData),
  remove: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, payload) => api.post(`/products/${id}/stock`, payload).then(getData),
  listMovements: (params) => api.get('/products/stock-movements', { params }).then(getList),
};

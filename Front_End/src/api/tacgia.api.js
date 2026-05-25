import api from './axios';

export const tacgiaApi = {
  getAll: (params) => api.get('/tacgia', { params }),
  getById: (id) => api.get(`/tacgia/${id}`),
  create: (payload) => api.post('/tacgia', payload),
  update: (id, payload) => api.put(`/tacgia/${id}`, payload),
  remove: (id) => api.delete(`/tacgia/${id}`),
};

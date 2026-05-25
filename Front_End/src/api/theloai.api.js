import api from './axios';

export const theloaiApi = {
  getAll: () => api.get('/theloai'),
  getById: (id) => api.get(`/theloai/${id}`),
  create: (payload) => api.post('/theloai', payload),
  update: (id, payload) => api.put(`/theloai/${id}`, payload),
  remove: (id) => api.delete(`/theloai/${id}`),
};

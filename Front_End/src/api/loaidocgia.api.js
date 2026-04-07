import api from './axios';

export const loaidocgiaApi = {
  getAll: () => api.get('/loaidocgia'),
  create: (payload) => api.post('/loaidocgia', payload),
  update: (id, payload) => api.put(`/loaidocgia/${id}`, payload),
  remove: (id) => api.delete(`/loaidocgia/${id}`),
};

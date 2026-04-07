import api from './axios';

export const policiesApi = {
  getAll: () => api.get('/policies'),
  update: (policies) => api.put('/policies', { policies }),
};

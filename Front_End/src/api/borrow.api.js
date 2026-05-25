import api from './axios';

export const borrowApi = {
  getAll: (params) => api.get('/borrows', { params }),
  create: (data) => api.post('/borrows', data),
  returnBook: (id) => api.put(`/borrows/${id}/return`),
  renew: (id) => api.put(`/borrows/${id}/renew`),
  syncOverdue: () => api.post('/borrows/sync-overdue'),
};

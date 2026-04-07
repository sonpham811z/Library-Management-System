import api from './axios';

export const reservationsApi = {
  getMy: () => api.get('/reservations/my'),
  create: (bookId) => api.post('/reservations', { book_id: bookId }),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
};

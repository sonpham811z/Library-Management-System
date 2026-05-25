import api from './axios';

export const readerCardsApi = {
  getAll: (params) => api.get('/reader-cards', { params }),
  getMyCard: () => api.get('/reader-cards/my'),
  getByReader: (readerId) => api.get(`/reader-cards/reader/${readerId}`),
  create: (readerId) => api.post(`/reader-cards/reader/${readerId}`),
  renew: (cardId) => api.put(`/reader-cards/${cardId}/renew`),
};

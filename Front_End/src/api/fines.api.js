import api from './axios';

export const finesApi = {
  getMyDebt: () => api.get('/fines/my-debt'),
  getReaderDebt: (readerId) => api.get(`/fines/reader/${readerId}`),
  collect: (data) => api.post('/fines/collect', data),
  getReceipts: (params) => api.get('/fines/receipts', { params }),
};

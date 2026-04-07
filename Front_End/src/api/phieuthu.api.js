import api from './axios';

export const phieuthuApi = {
  /** List receipts (paginated) */
  getAll: (params) => api.get('/phieuthu', { params }),
  /** Get reader's current debt by madocgia */
  getDebt: (madocgia) => api.get(`/phieuthu/debt/${madocgia}`),
  /**
   * Collect fine payment.
   * payload: { madocgia, sotienthu }
   * Validates sotienthu <= TienNo on server.
   */
  create: (payload) => api.post('/phieuthu', payload),
};

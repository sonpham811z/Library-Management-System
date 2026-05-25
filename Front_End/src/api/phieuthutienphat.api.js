import api from './axios';

export const phieuthutienphatApi = {
  getAll:  (params) => api.get('/phieuthutienphat', { params }),
  getDebt: (madocgia) => api.get(`/phieuthutienphat/debt/${madocgia}`),
  /**
   * payload: { madocgia, sotienthu }
   * Server validates sotienthu <= tienno.
   */
  create:  (payload) => api.post('/phieuthutienphat', payload),
};

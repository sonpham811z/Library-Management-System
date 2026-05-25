import api from './axios';

export const phieutraApi = {
  getAll:  (params) => api.get('/phieutra', { params }),
  getById: (id) => api.get(`/phieutra/${id}`),
  /**
   * payload: { madocgia, masachlist: [number, ...] }
   * Server calculates fines and updates TienNo automatically.
   */
  create:  (payload) => api.post('/phieutra', payload),
};

import api from './axios';

export const tuasachApi = {
  getAll: (params) => api.get('/tuasach', { params }),
  getById: (id) => api.get(`/tuasach/${id}`),
  /**
   * payload: { tentuasach, matheloai, anhbia?, matacgialist: number[] }
   */
  create: (payload) => api.post('/tuasach', payload),
  update: (id, payload) => api.put(`/tuasach/${id}`, payload),
  remove: (id) => api.delete(`/tuasach/${id}`),
};

import api from './axios';

export const nhomnguoidungApi = {
  getAll: () => api.get('/nhomnguoidung'),
  getById: (id) => api.get(`/nhomnguoidung/${id}`),
  getPhanQuyen: (id) => api.get(`/nhomnguoidung/${id}/phanquyen`),
  create: (payload) => api.post('/nhomnguoidung', payload),
  update: (id, payload) => api.put(`/nhomnguoidung/${id}`, payload),
  setPhanQuyen: (id, machucnangList) => api.put(`/nhomnguoidung/${id}/phanquyen`, { machucnangList }),
  remove: (id) => api.delete(`/nhomnguoidung/${id}`),
};

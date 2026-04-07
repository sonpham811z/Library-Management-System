import api from './axios';

export const nguoidungApi = {
  getAll: (params) => api.get('/nguoidung', { params }),
  getById: (id) => api.get(`/nguoidung/${id}`),
  /** payload: { tendangnhap, matkhau, manhom } */
  create: (payload) => api.post('/nguoidung', payload),
  /** payload: { manhom } */
  update: (id, payload) => api.put(`/nguoidung/${id}`, payload),
  remove: (id) => api.delete(`/nguoidung/${id}`),
};

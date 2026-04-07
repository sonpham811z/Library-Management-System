import api from './axios';

export const sachApi = {
  getAll: (params) => api.get('/sach', { params }),
  /** Autocomplete search for available books by TenTuaSach, NhaXB, or MaSach. */
  search: (q) => api.get('/sach/search', { params: { q } }),
  getById: (id) => api.get(`/sach/${id}`),
  /** payload: { matuasach, namxb, nhaxb?, ngaynhap, trigia } */
  create: (payload) => api.post('/sach', payload),
  update: (id, payload) => api.put(`/sach/${id}`, payload),
  remove: (id) => api.delete(`/sach/${id}`),
  /**
   * Upload Excel/CSV file for bulk insert.
   * @param {File} file - .xlsx, .xls, or .csv
   */
  bulkInsert: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/sach/bulk', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

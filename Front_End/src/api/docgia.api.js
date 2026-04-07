import api from './axios';

export const docgiaApi = {
  /** Finds the DOCGIA record linked to the logged-in reader account (by email = tendangnhap). */
  getMe: () => api.get('/docgia/me'),
  /** Autocomplete search by HoTen, Email, or MaDocGia. Returns up to 10 matches. */
  search: (q) => api.get('/docgia/search', { params: { q } }),
  getAll: (params) => api.get('/docgia', { params }),
  getById: (id) => api.get(`/docgia/${id}`),
  /**
   * payload: { hoten, ngaysinh, diachi, email, maloaidocgia }
   * Server will auto-validate age via THAMSO and calculate NgayHetHan.
   */
  create: (payload) => api.post('/docgia', payload),
  update: (id, payload) => api.put(`/docgia/${id}`, payload),
  giaHan: (id) => api.put(`/docgia/${id}/giahan`),
  remove: (id) => api.delete(`/docgia/${id}`),
  /**
   * Upload avatar image for the logged-in reader.
   * @param {File} file - jpg/png/webp, max 3 MB
   */
  updateAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.patch('/docgia/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

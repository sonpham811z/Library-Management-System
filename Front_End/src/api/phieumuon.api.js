import api from './axios';

export const phieumuonApi = {
  /** Returns phieumuon belonging to the logged-in reader (looked up by email). */
  getMy:     (params) => api.get('/phieumuon/my', { params }),
  getAll:    (params) => api.get('/phieumuon', { params }),
  getById:   (id) => api.get(`/phieumuon/${id}`),
  getActive: (madocgia) => api.get(`/phieumuon/active/${madocgia}`),
  /**
   * payload: { madocgia, masachlist: [number, ...] }
   * Server validates: card validity, no overdue, borrow limit, book availability.
   */
  create:    (payload) => api.post('/phieumuon', payload),
};

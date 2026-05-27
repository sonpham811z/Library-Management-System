import api from './axios';

export const phieumuonApi = {
  /** Returns phieumuon belonging to the logged-in reader (looked up by email). */
  getMy:     (params) => api.get('/phieumuon/my', { params }),
  getAll:    (params) => api.get('/phieumuon', { params }),
  getById:   (id) => api.get(`/phieumuon/${id}`),
  getActive: (madocgia) => api.get(`/phieumuon/active/${madocgia}`),
  /**
   * Tạo phiếu mượn mới.
   * payload: { madocgia, masachlist: [number, ...] }
   * Server validates: card validity, no overdue, borrow limit, book availability.
   * Server saves snapshot (tentuasach, anhbia, nhaxb, namxb) in CT_PHIEUMUON.
   */
  create:    (payload) => api.post('/phieumuon', payload),
  /**
   * Cập nhật phiếu mượn (chỉ thay đổi hạn trả).
   * payload: { hantra: 'YYYY-MM-DD' }
   */
  update:    (id, payload) => api.put(`/phieumuon/${id}`, payload),
  /**
   * Xóa phiếu mượn.
   * Backend tự trả sách về "Có sẵn" nếu chưa có phiếu trả.
   */
  remove:    (id) => api.delete(`/phieumuon/${id}`),
};

import api from './axios';

export const datchoApi = {
  /** READER: get own reservations (auto-cancels expired holds server-side) */
  getMy: () => api.get('/datcho/my'),
  /** ADMIN/STAFF: list all reservations */
  getAll: (params) => api.get('/datcho', { params }),
  /**
   * READER: create reservation for a tuasach.
   * Server validates all copies are currently borrowed.
   */
  create: (matuasach) => api.post('/datcho', { matuasach }),
  /** Cancel a reservation (reader: own 'Đang chờ' only; staff: any) */
  cancel: (madatcho) => api.patch(`/datcho/${madatcho}/cancel`),
  /**
   * STAFF: Convert 'Đã có sách' reservation into a PHIEUMUON.
   * Creates the loan slip for the reader picking up their book.
   */
  confirm: (madatcho) => api.post(`/datcho/${madatcho}/confirm`),
  /** ADMIN/STAFF: manually trigger auto-cancel of expired holds */
  autoCancelExpired: () => api.post('/datcho/auto-cancel'),
};

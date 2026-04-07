import api from './axios';

export const thamsoApi = {
  /** Returns [{ tenthamso, giatri }] */
  getAll: () => api.get('/thamso'),

  /**
   * Update one or more params
   * @param {Array<{ tenthamso: string, giatri: number }>} params
   */
  updateMany: (params) => api.put('/thamso', { params }),
};

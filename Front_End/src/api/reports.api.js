import api from './axios';

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getBorrowByCategory: (params) => api.get('/reports/borrow-by-category', { params }),
  getOverdue: (params) => api.get('/reports/overdue', { params }),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getBorrowTrend: (params) => api.get('/reports/borrow-trend', { params }),
};

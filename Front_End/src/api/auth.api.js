import api from './axios';

export const authApi = {
  login: ({ tendangnhap, matkhau }) => api.post('/auth/login', { tendangnhap, matkhau }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
};

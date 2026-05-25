import api from './axios';

export const baocaoApi = {
  // BCTINHHINHMUONSACH
  getAllMuonSach:    (params) => api.get('/baocao/muonsach', { params }),
  getMuonSachById:  (id) => api.get(`/baocao/muonsach/${id}`),
  generateMuonSach: (payload) => api.post('/baocao/muonsach', payload),   // { thang, nam }

  // BCSACHTRATRE
  getAllSachTraTre:    (params) => api.get('/baocao/sachtratre', { params }),
  getSachTraTreById:  (id) => api.get(`/baocao/sachtratre/${id}`),
  generateSachTraTre: () => api.post('/baocao/sachtratre'),
};

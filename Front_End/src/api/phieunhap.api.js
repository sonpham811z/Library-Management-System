import api from "./axios";

export const phieunhapApi = {
  getAll: (params) => api.get("/phieunhap", { params }),
  getById: (id) => api.get(`/phieunhap/${id}`),
  create: (payload) => api.post("/phieunhap", payload), // payload: { ngaynhap, tongtien: 0 }
  saveDetails: (id, payload) => api.put(`/phieunhap/${id}/details`, payload), // payload: { details, tongtien }
};

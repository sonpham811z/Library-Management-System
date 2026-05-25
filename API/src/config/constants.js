// ─── THAMSO Keys (must match exact string values stored in DB) ──────────────
const THAMSO = {
  TUOI_TOI_THIEU:    'TuoiToiThieu',              // Minimum reader age
  TUOI_TOI_DA:       'TuoiToiDa',                 // Maximum reader age
  THOI_HAN_THE_THANG: 'ThoiHanTheThang',          // Card validity in months
  SO_NGAY_MUON_TOI_DA: 'SoNgayMuonToiDa',        // Max borrow duration (days)
  SO_SACH_MUON_TOI_DA: 'SoSachMuonToiDa',        // Max books per borrow
  TIEN_PHAT_MOT_NGAY: 'TienPhatTreHanMotNgay',   // Fine per overdue day (VND)
  THOI_HAN_GIU_SACH: 'ThoiHanGiuSach',           // Days to pick up a reserved book
};

// ─── SACH.TrangThai values ───────────────────────────────────────────────────
const TRANG_THAI_SACH = {
  CO_SAN:       'Có sẵn',
  DA_MUON:      'Đã mượn',
  DANG_GIU_CHO: 'Đang giữ chỗ', // held for a specific reservation
};

// ─── Auth roles (used in JWT payload, maps to MaNhom in NHOMNGUOIDUNG) ──────
// Keep as strings for JWT; actual group IDs are in DB
const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
};

module.exports = { THAMSO, TRANG_THAI_SACH, ROLES };

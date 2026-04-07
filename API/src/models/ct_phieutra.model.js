// Model: CT_PHIEUTRA (Chi Tiết Phiếu Trả)
// Table: ct_phieutra | Composite PK: (maphieutra, maphieumuon, masach)
// Columns: maphieutra, maphieumuon, masach, songaytratre, tienphat
const supabase = require('../config/supabase');

const TABLE = 'ct_phieutra';

const findByPhieu = async (maPhieuTra) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('maphieumuon, masach, songaytratre, tienphat, sach(matuasach, tuasach(tentuasach))')
    .eq('maphieutra', maPhieuTra);
  if (error) throw error;
  return data;
};

const addMany = async (maPhieuTra, details) => {
  // details: [{ maphieumuon, masach, songaytratre, tienphat }]
  const rows = details.map(({ maphieumuon, masach, songaytratre = 0, tienphat = 0 }) => ({
    maphieutra: maPhieuTra,
    maphieumuon,
    masach,
    songaytratre,
    tienphat,
  }));
  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return data;
};

module.exports = { findByPhieu, addMany };

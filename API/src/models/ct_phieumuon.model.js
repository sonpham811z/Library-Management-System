// Model: CT_PHIEUMUON (Chi Tiết Phiếu Mượn)
// Table: ct_phieumuon | Composite PK: (maphieumuon, masach)
const supabase = require('../config/supabase');

const TABLE = 'ct_phieumuon';

const findByPhieu = async (maPhieuMuon) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('masach, sach(matuasach, namxb, tuasach(tentuasach))')
    .eq('maphieumuon', maPhieuMuon);
  if (error) throw error;
  return data;
};

/** Find all active borrow details for a reader (not yet returned) */
const findActiveBySach = async (maSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('maphieumuon, phieumuon(madocgia, ngaymuon, hantra)')
    .eq('masach', maSach);
  if (error) throw error;
  return data;
};

const addMany = async (maPhieuMuon, maSachList) => {
  const rows = maSachList.map((masach) => ({ maphieumuon: maPhieuMuon, masach }));
  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return data;
};

const remove = async (maPhieuMuon, maSach) => {
  const { error } = await supabase
    .from(TABLE).delete().eq('maphieumuon', maPhieuMuon).eq('masach', maSach);
  if (error) throw error;
};

module.exports = { findByPhieu, findActiveBySach, addMany, remove };

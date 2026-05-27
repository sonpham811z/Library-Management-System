// Model: CT_PHIEUMUON (Chi Tiết Phiếu Mượn)
// Table: ct_phieumuon | Composite PK: (maphieumuon, masach)
// Snapshot columns (tentuasach_snapshot, anhbia_snapshot, nhaxb_snapshot, namxb_snapshot)
// lưu thông tin sách tại thời điểm mượn để lịch sử không bị ảnh hưởng khi sửa sách.
const supabase = require('../config/supabase');

const TABLE = 'ct_phieumuon';

const findByPhieu = async (maPhieuMuon) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('masach, tentuasach_snapshot, anhbia_snapshot, nhaxb_snapshot, namxb_snapshot, sach(matuasach, namxb, nhaxb, tuasach(tentuasach, anhbia))')
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

/**
 * Insert CT_PHIEUMUON rows with snapshot data.
 * @param {number} maPhieuMuon
 * @param {Array<number|{masach,tentuasach_snapshot?,anhbia_snapshot?,nhaxb_snapshot?,namxb_snapshot?}>} sachItems
 *   Accepts either a plain number (masach) for backward compatibility,
 *   or an object with masach + snapshot fields.
 */
const addMany = async (maPhieuMuon, sachItems) => {
  const rows = sachItems.map((item) => {
    if (typeof item === 'number') {
      return { maphieumuon: maPhieuMuon, masach: item };
    }
    return {
      maphieumuon:          maPhieuMuon,
      masach:               item.masach,
      tentuasach_snapshot:  item.tentuasach_snapshot  || null,
      anhbia_snapshot:      item.anhbia_snapshot      || null,
      nhaxb_snapshot:       item.nhaxb_snapshot       || null,
      namxb_snapshot:       item.namxb_snapshot       || null,
    };
  });
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

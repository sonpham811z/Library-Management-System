// Model: PHIEUTRA (Phiếu Trả / Return Slip)
// Table: phieutra | PK: maphieutra
const supabase = require('../config/supabase');

const TABLE = 'phieutra';

const findById = async (maPhieuTra) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, docgia(hoten), ct_phieutra(maphieumuon, masach, songaytratre, tienphat, sach(matuasach, tuasach(tentuasach)))')
    .eq('maphieutra', maPhieuTra)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, maDocGia } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('maphieutra, madocgia, ngaytra, tienphatkynay, docgia(hoten), ct_phieutra(maphieumuon, masach)', { count: 'exact' });

  if (maDocGia) query = query.eq('madocgia', maDocGia);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('maphieutra', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const create = async ({ madocgia, ngaytra, tienphatkynay = 0 }) => {
  const { data, error } = await supabase
    .from(TABLE).insert({ madocgia, ngaytra, tienphatkynay }).select().single();
  if (error) throw error;
  return data;
};

module.exports = { findById, findAll, create };

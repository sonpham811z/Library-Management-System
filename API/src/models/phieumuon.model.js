// Model: PHIEUMUON (Phiếu Mượn / Borrow Slip)
// Table: phieumuon | PK: maphieumuon
const supabase = require('../config/supabase');

const TABLE = 'phieumuon';

const findById = async (maPhieuMuon) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, docgia(hoten, email), ct_phieumuon(masach, sach(matuasach, trangthai, tuasach(tentuasach)))')
    .eq('maphieumuon', maPhieuMuon)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, maDocGia } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('maphieumuon, madocgia, ngaymuon, hantra, docgia(hoten), ct_phieumuon(masach, sach(matuasach, trangthai, tuasach(tentuasach)))', { count: 'exact' });

  if (maDocGia) query = query.eq('madocgia', maDocGia);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('maphieumuon', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const create = async ({ madocgia, ngaymuon, hantra }) => {
  const { data, error } = await supabase
    .from(TABLE).insert({ madocgia, ngaymuon, hantra }).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maPhieuMuon) => {
  const { error } = await supabase.from(TABLE).delete().eq('maphieumuon', maPhieuMuon);
  if (error) throw error;
};

module.exports = { findById, findAll, create, remove };

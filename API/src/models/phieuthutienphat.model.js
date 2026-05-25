// Model: PHIEUTHUTIENPHAT (Phiếu Thu Tiền Phạt / Fine Payment Receipt)
// Table: phieuthutienphat | PK: maphieuthu
const supabase = require('../config/supabase');

const TABLE = 'phieuthutienphat';

const findById = async (maPhieuThu) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, docgia(hoten, tienno)')
    .eq('maphieuthu', maPhieuThu)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, maDocGia } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('maphieuthu, madocgia, ngaythu, sotienthu, conlai, docgia(hoten)', { count: 'exact' });

  if (maDocGia) query = query.eq('madocgia', maDocGia);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('maphieuthu', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const create = async ({ madocgia, ngaythu, sotienthu, conlai = 0 }) => {
  const { data, error } = await supabase
    .from(TABLE).insert({ madocgia, ngaythu, sotienthu, conlai }).select().single();
  if (error) throw error;
  return data;
};

module.exports = { findById, findAll, create };

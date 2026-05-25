// Model: NGUOIDUNG (Người Dùng / Login Accounts)
// Table: nguoidung | PK: manguoidung
const supabase = require('../config/supabase');

const TABLE = 'nguoidung';

const findById = async (maNguoiDung) => {
  const { data, error } = await supabase.from(TABLE).select('manguoidung, tendangnhap, manhom').eq('manguoidung', maNguoiDung).single();
  if (error) throw error;
  return data;
};

/** Includes matkhau — ONLY for internal auth use */
const findByIdFull = async (maNguoiDung) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('manguoidung', maNguoiDung).single();
  if (error) throw error;
  return data;
};

const findByTenDangNhap = async (tenDangNhap) => {
  // Includes matkhau for auth verification — use carefully
  const { data, error } = await supabase.from(TABLE).select('*').eq('tendangnhap', tenDangNhap).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20 } = {}) => {
  const from = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from(TABLE)
    .select('manguoidung, tendangnhap, manhom, nhomnguoidung(tennhom)', { count: 'exact' })
    .range(from, from + limit - 1)
    .order('manguoidung');
  if (error) throw error;
  return { data, count };
};

const create = async ({ tendangnhap, matkhau, manhom }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ tendangnhap, matkhau, manhom })
    .select('manguoidung, tendangnhap, manhom')
    .single();
  if (error) throw error;
  return data;
};

const update = async (maNguoiDung, payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('manguoidung', maNguoiDung)
    .select('manguoidung, tendangnhap, manhom')
    .single();
  if (error) throw error;
  return data;
};

const remove = async (maNguoiDung) => {
  const { error } = await supabase.from(TABLE).delete().eq('manguoidung', maNguoiDung);
  if (error) throw error;
};

module.exports = { findById, findByIdFull, findByTenDangNhap, findAll, create, update, remove };

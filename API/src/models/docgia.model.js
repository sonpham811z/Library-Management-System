// Model: DOCGIA (Độc Giả / Library Reader Cards)
// Table: docgia | PK: madocgia
const supabase = require('../config/supabase');

const TABLE = 'docgia';

const findById = async (maDocGia) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, loaidocgia(tenloaidocgia)')
    .eq('madocgia', maDocGia)
    .single();
  if (error) throw error;
  return data;
};

const findByEmail = async (email) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('email', email).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Autocomplete search by HoTen, Email, or MaDocGia (if q is numeric).
 * Returns up to `limit` results for dropdown display.
 */
const search = async (q, limit = 10) => {
  let query = supabase
    .from(TABLE)
    .select('madocgia, hoten, email, ngayhethan')
    .limit(limit);

  const numQ = parseInt(q, 10);
  if (!isNaN(numQ)) {
    query = query.or(`hoten.ilike.%${q}%,email.ilike.%${q}%,madocgia.eq.${numQ}`);
  } else {
    query = query.or(`hoten.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const findByNguoiDung = async (maNguoiDung) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, loaidocgia(tenloaidocgia)')
    .eq('manguoidung', maNguoiDung)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, search } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('madocgia, hoten, ngaysinh, email, ngaylapthe, ngayhethan, tienno, maloaidocgia, manguoidung, loaidocgia(tenloaidocgia)', { count: 'exact' });

  if (search) query = query.or(`hoten.ilike.%${search}%,email.ilike.%${search}%`);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('madocgia', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const create = async (payload) => {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data;
};

const update = async (maDocGia, payload) => {
  const { data, error } = await supabase
    .from(TABLE).update(payload).eq('madocgia', maDocGia).select().single();
  if (error) throw error;
  return data;
};

/** Increase/decrease TienNo */
const adjustTienNo = async (maDocGia, delta) => {
  const { data: current, error: fetchErr } = await supabase
    .from(TABLE).select('tienno').eq('madocgia', maDocGia).single();
  if (fetchErr) throw fetchErr;

  const newDebt = Number(current.tienno) + delta;
  const { data, error } = await supabase
    .from(TABLE).update({ tienno: newDebt }).eq('madocgia', maDocGia).select('madocgia, tienno').single();
  if (error) throw error;
  return data;
};

const remove = async (maDocGia) => {
  const { error } = await supabase.from(TABLE).delete().eq('madocgia', maDocGia);
  if (error) throw error;
};

module.exports = { findById, findByEmail, findByNguoiDung, search, findAll, create, update, adjustTienNo, remove };

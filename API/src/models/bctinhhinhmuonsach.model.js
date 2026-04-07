// Model: BCTINHHINHMUONSACH (Báo Cáo Tình Hình Mượn Sách / Monthly Borrow Report)
// Table: bctinhhinhmuonsach | PK: mabaocao
const supabase = require('../config/supabase');

const TABLE = 'bctinhhinhmuonsach';

const findById = async (maBaoCao) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, ct_bctinhhinhmuonsach(matheloai, soluotmuon, tile, theloai(tentheloai))')
    .eq('mabaocao', maBaoCao)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ nam, thang } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('mabaocao, thang, nam, tongsoluotmuon')
    .order('nam', { ascending: false })
    .order('thang', { ascending: false });

  if (nam) query = query.eq('nam', nam);
  if (thang) query = query.eq('thang', thang);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findOrCreate = async (thang, nam) => {
  const { data: existing } = await supabase
    .from(TABLE).select('*').eq('thang', thang).eq('nam', nam).single();
  if (existing) return existing;

  const { data, error } = await supabase
    .from(TABLE).insert({ thang, nam, tongsoluotmuon: 0 }).select().single();
  if (error) throw error;
  return data;
};

const updateTongSo = async (maBaoCao, tongSo) => {
  const { data, error } = await supabase
    .from(TABLE).update({ tongsoluotmuon: tongSo }).eq('mabaocao', maBaoCao).select().single();
  if (error) throw error;
  return data;
};

module.exports = { findById, findAll, findOrCreate, updateTongSo };

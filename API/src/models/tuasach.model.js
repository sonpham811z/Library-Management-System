// Model: TUASACH (Tựa Sách / Book Titles)
// Table: tuasach | PK: matuasach
// Columns: matuasach, tentuasach, matheloai, anhbia
const supabase = require('../config/supabase');

const TABLE = 'tuasach';

const findById = async (maTuaSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, theloai(tentheloai), ct_tacgia(matacgia, tacgia(tentacgia))')
    .eq('matuasach', maTuaSach)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, search, maTheLoai } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('matuasach, tentuasach, anhbia, matheloai, theloai(tentheloai), ct_tacgia(tacgia(tentacgia))', { count: 'exact' });

  if (search) query = query.ilike('tentuasach', `%${search}%`);
  if (maTheLoai) query = query.eq('matheloai', maTheLoai);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('matuasach', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const create = async ({ tentuasach, matheloai, anhbia = null }) => {
  const { data, error } = await supabase
    .from(TABLE).insert({ tentuasach, matheloai, anhbia }).select().single();
  if (error) throw error;
  return data;
};

const update = async (maTuaSach, payload) => {
  const { data, error } = await supabase
    .from(TABLE).update(payload).eq('matuasach', maTuaSach).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maTuaSach) => {
  const { error } = await supabase.from(TABLE).delete().eq('matuasach', maTuaSach);
  if (error) throw error;
};

module.exports = { findById, findAll, create, update, remove };

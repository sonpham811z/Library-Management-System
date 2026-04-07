// Model: THELOAI (Thể Loại / Book Categories)
// Table: theloai | PK: matheloai
const supabase = require('../config/supabase');

const TABLE = 'theloai';

const findAll = async () => {
  const { data, error } = await supabase.from(TABLE).select('*').order('matheloai');
  if (error) throw error;
  return data;
};

const findById = async (maTheLoai) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('matheloai', maTheLoai).single();
  if (error) throw error;
  return data;
};

const create = async ({ tentheloai }) => {
  const { data, error } = await supabase.from(TABLE).insert({ tentheloai }).select().single();
  if (error) throw error;
  return data;
};

const update = async (maTheLoai, { tentheloai }) => {
  const { data, error } = await supabase
    .from(TABLE).update({ tentheloai }).eq('matheloai', maTheLoai).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maTheLoai) => {
  const { error } = await supabase.from(TABLE).delete().eq('matheloai', maTheLoai);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, remove };

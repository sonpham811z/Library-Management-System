// Model: LOAIDOCGIA (Loại Độc Giả / Reader Types)
// Table: loaidocgia | PK: maloaidocgia
const supabase = require('../config/supabase');

const TABLE = 'loaidocgia';

const findAll = async () => {
  const { data, error } = await supabase.from(TABLE).select('*').order('maloaidocgia');
  if (error) throw error;
  return data;
};

const findById = async (maLoai) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('maloaidocgia', maLoai).single();
  if (error) throw error;
  return data;
};

const create = async ({ tenloaidocgia }) => {
  const { data, error } = await supabase.from(TABLE).insert({ tenloaidocgia }).select().single();
  if (error) throw error;
  return data;
};

const update = async (maLoai, { tenloaidocgia }) => {
  const { data, error } = await supabase
    .from(TABLE).update({ tenloaidocgia }).eq('maloaidocgia', maLoai).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maLoai) => {
  const { error } = await supabase.from(TABLE).delete().eq('maloaidocgia', maLoai);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, remove };

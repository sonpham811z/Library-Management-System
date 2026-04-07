// Model: TACGIA (Tác Giả / Authors)
// Table: tacgia | PK: matacgia
const supabase = require('../config/supabase');

const TABLE = 'tacgia';

const findAll = async ({ search } = {}) => {
  let query = supabase.from(TABLE).select('*').order('tentacgia');
  if (search) query = query.ilike('tentacgia', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (maTacGia) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('matacgia', maTacGia).single();
  if (error) throw error;
  return data;
};

const create = async ({ tentacgia }) => {
  const { data, error } = await supabase.from(TABLE).insert({ tentacgia }).select().single();
  if (error) throw error;
  return data;
};

const update = async (maTacGia, { tentacgia }) => {
  const { data, error } = await supabase
    .from(TABLE).update({ tentacgia }).eq('matacgia', maTacGia).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maTacGia) => {
  const { error } = await supabase.from(TABLE).delete().eq('matacgia', maTacGia);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, remove };

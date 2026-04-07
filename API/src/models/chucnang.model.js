// Model: CHUCNANG (Chức Năng / Features)
// Table: chucnang | PK: machucnang
const supabase = require('../config/supabase');

const TABLE = 'chucnang';

const findAll = async () => {
  const { data, error } = await supabase.from(TABLE).select('*').order('machucnang');
  if (error) throw error;
  return data;
};

const findById = async (maChucNang) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('machucnang', maChucNang).single();
  if (error) throw error;
  return data;
};

const create = async ({ tenchucnang, tenmanhinh }) => {
  const { data, error } = await supabase.from(TABLE).insert({ tenchucnang, tenmanhinh }).select().single();
  if (error) throw error;
  return data;
};

const update = async (maChucNang, payload) => {
  const { data, error } = await supabase
    .from(TABLE).update(payload).eq('machucnang', maChucNang).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maChucNang) => {
  const { error } = await supabase.from(TABLE).delete().eq('machucnang', maChucNang);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, remove };

// Model: NHOMNGUOIDUNG (Nhóm Người Dùng / User Groups)
// Table: nhomnguoidung | PK: manhom
const supabase = require('../config/supabase');

const TABLE = 'nhomnguoidung';

const findAll = async () => {
  const { data, error } = await supabase.from(TABLE).select('*').order('manhom');
  if (error) throw error;
  return data;
};

const findById = async (maNhom) => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('manhom', maNhom).single();
  if (error) throw error;
  return data;
};

const create = async ({ tennhom }) => {
  const { data, error } = await supabase.from(TABLE).insert({ tennhom }).select().single();
  if (error) throw error;
  return data;
};

const update = async (maNhom, { tennhom }) => {
  const { data, error } = await supabase
    .from(TABLE).update({ tennhom }).eq('manhom', maNhom).select().single();
  if (error) throw error;
  return data;
};

const remove = async (maNhom) => {
  const { error } = await supabase.from(TABLE).delete().eq('manhom', maNhom);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, remove };

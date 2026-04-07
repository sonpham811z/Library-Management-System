// Model: BCSACHTRATRE (Báo Cáo Sách Trả Trễ / Late Return Report)
// Table: bcsachtratre | PK: mabaocao
const supabase = require('../config/supabase');

const TABLE = 'bcsachtratre';

const findById = async (maBaoCao) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, ct_bcsachtratre(masach, songaytratre, sach(matuasach, tuasach(tentuasach)))')
    .eq('mabaocao', maBaoCao)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async () => {
  const { data, error } = await supabase
    .from(TABLE).select('*').order('ngay', { ascending: false });
  if (error) throw error;
  return data;
};

const create = async (ngay) => {
  const { data, error } = await supabase.from(TABLE).insert({ ngay }).select().single();
  if (error) throw error;
  return data;
};

module.exports = { findById, findAll, create };

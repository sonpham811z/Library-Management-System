// Model: CT_BCSACHTRATRE (Chi Tiết Báo Cáo Sách Trả Trễ)
// Table: ct_bcsachtratre | Composite PK: (mabaocao, masach)
const supabase = require('../config/supabase');

const TABLE = 'ct_bcsachtratre';

const findByBaoCao = async (maBaoCao) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('masach, songaytratre, sach(matuasach, tuasach(tentuasach))')
    .eq('mabaocao', maBaoCao);
  if (error) throw error;
  return data;
};

const addMany = async (maBaoCao, details) => {
  // details: [{ masach, songaytratre }]
  const rows = details.map(({ masach, songaytratre = 0 }) => ({
    mabaocao: maBaoCao,
    masach,
    songaytratre,
  }));
  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return data;
};

module.exports = { findByBaoCao, addMany };

// Model: CT_TACGIA (Chi Tiết Tác Giả / Title-Author mapping)
// Table: ct_tacgia | Composite PK: (matuasach, matacgia)
const supabase = require('../config/supabase');

const TABLE = 'ct_tacgia';

const findByTuaSach = async (maTuaSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('matacgia, tacgia(tentacgia)')
    .eq('matuasach', maTuaSach);
  if (error) throw error;
  return data;
};

const add = async (maTuaSach, maTacGia) => {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ matuasach: maTuaSach, matacgia: maTacGia }, { onConflict: 'matuasach,matacgia' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (maTuaSach, maTacGia) => {
  const { error } = await supabase
    .from(TABLE).delete().eq('matuasach', maTuaSach).eq('matacgia', maTacGia);
  if (error) throw error;
};

/** Replace all authors for a title */
const setForTuaSach = async (maTuaSach, maTacGiaList) => {
  await supabase.from(TABLE).delete().eq('matuasach', maTuaSach);
  if (!maTacGiaList.length) return [];
  const rows = maTacGiaList.map((matacgia) => ({ matuasach: maTuaSach, matacgia }));
  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return data;
};

module.exports = { findByTuaSach, add, remove, setForTuaSach };

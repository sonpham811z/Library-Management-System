// Model: CT_BCTINHHINHMUONSACH (Chi Tiết Báo Cáo Mượn Sách)
// Table: ct_bctinhhinhmuonsach | Composite PK: (mabaocao, matheloai)
const supabase = require('../config/supabase');

const TABLE = 'ct_bctinhhinhmuonsach';

const findByBaoCao = async (maBaoCao) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('matheloai, soluotmuon, tile, theloai(tentheloai)')
    .eq('mabaocao', maBaoCao);
  if (error) throw error;
  return data;
};

const upsertDetail = async (maBaoCao, maTheLoai, soLuotMuon, tiLe) => {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ mabaocao: maBaoCao, matheloai: maTheLoai, soluotmuon: soLuotMuon, tile: tiLe }, { onConflict: 'mabaocao,matheloai' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { findByBaoCao, upsertDetail };

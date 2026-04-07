// Model: PHANQUYEN (Phân Quyền / Permissions)
// Table: phanquyen | Composite PK: (manhom, machucnang)
const supabase = require('../config/supabase');

const TABLE = 'phanquyen';

/** Get all permissions for a group */
const findByNhom = async (maNhom) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('machucnang, chucnang(tenchucnang, tenmanhinh)')
    .eq('manhom', maNhom);
  if (error) throw error;
  return data;
};

/** Get all permissions (all groups) */
const findAll = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('manhom, machucnang, nhomnguoidung(tennhom), chucnang(tenchucnang, tenmanhinh)');
  if (error) throw error;
  return data;
};

/** Grant a permission to a group */
const grant = async (maNhom, maChucNang) => {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ manhom: maNhom, machucnang: maChucNang }, { onConflict: 'manhom,machucnang' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Revoke a permission from a group */
const revoke = async (maNhom, maChucNang) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('manhom', maNhom)
    .eq('machucnang', maChucNang);
  if (error) throw error;
};

/** Replace all permissions for a group */
const setForNhom = async (maNhom, maChucNangList) => {
  await supabase.from(TABLE).delete().eq('manhom', maNhom);
  if (!maChucNangList.length) return [];
  const rows = maChucNangList.map((maChucNang) => ({ manhom: maNhom, machucnang: maChucNang }));
  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) throw error;
  return data;
};

module.exports = { findByNhom, findAll, grant, revoke, setForNhom };

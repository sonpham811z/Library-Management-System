// Model: THAMSO (Tham Số Quy Định)
// Table: thamso | PK: tenthamso (VARCHAR) | GiaTri: giatri (NUMERIC)
const supabase = require('../config/supabase');

const TABLE = 'thamso';

/** Returns all params as array: [{ tenthamso, giatri }] */
const getAll = async () => {
  const { data, error } = await supabase.from(TABLE).select('*').order('tenthamso');
  if (error) throw error;
  return data;
};

/** Returns all params as a key→value map: { TuoiToiThieu: 18, ... } */
const getAsMap = async () => {
  const rows = await getAll();
  return rows.reduce((acc, row) => {
    acc[row.tenthamso] = Number(row.giatri);
    return acc;
  }, {});
};

/** Returns the numeric value of a single param */
const getGiaTri = async (tenThamSo) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('giatri')
    .eq('tenthamso', tenThamSo)
    .single();
  if (error) throw error;
  return Number(data.giatri);
};

/** Upsert a single param */
const upsert = async (tenThamSo, giaTri) => {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ tenthamso: tenThamSo, giatri: Number(giaTri) }, { onConflict: 'tenthamso' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Bulk update: accepts [{ tenthamso, giatri }] */
const updateMany = async (params) => {
  const results = [];
  for (const { tenthamso, giatri } of params) {
    const updated = await upsert(tenthamso, giatri);
    results.push(updated);
  }
  return results;
};

module.exports = { getAll, getAsMap, getGiaTri, upsert, updateMany };

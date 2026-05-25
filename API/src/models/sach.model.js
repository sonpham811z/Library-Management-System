// Model: SACH (Sách / Physical Book Copies)
// Table: sach | PK: masach
// TrangThai values: 'Có sẵn' | 'Đã mượn' | 'Đang giữ chỗ'
const supabase = require('../config/supabase');

const TABLE = 'sach';

const TRANG_THAI = {
  CO_SAN:       'Có sẵn',
  DA_MUON:      'Đã mượn',
  DANG_GIU_CHO: 'Đang giữ chỗ', // held for a queued reservation
};

const findById = async (maSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, tuasach(tentuasach, anhbia, matheloai, theloai(tentheloai), ct_tacgia(tacgia(tentacgia)))')
    .eq('masach', maSach)
    .single();
  if (error) throw error;
  return data;
};

const findAll = async ({ page = 1, limit = 20, maTuaSach, trangThai, search } = {}) => {
  let query = supabase
    .from(TABLE)
    .select('masach, matuasach, namxb, nhaxb, ngaynhap, trigia, trangthai, tuasach(tentuasach, anhbia)', { count: 'exact' });

  if (maTuaSach) query = query.eq('matuasach', maTuaSach);
  if (trangThai) query = query.eq('trangthai', trangThai);
  if (search) {
    // search by title via join is done via ilike on tuasach name — requires RPC for true join filter
    // Basic: filter by masach if numeric, otherwise skip
    const id = parseInt(search);
    if (!isNaN(id)) query = query.eq('masach', id);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('masach', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

/**
 * Autocomplete search for AVAILABLE books.
 * Searches: TenTuaSach (via tuasach join), NhaXB, MaSach (exact if numeric).
 * Only returns TrangThai = 'Có sẵn'.
 */
const search = async (q, limit = 15) => {
  const numQ = parseInt(q, 10);

  // Step 1: find tuasach IDs whose title matches
  const { data: titles } = await supabase
    .from('tuasach')
    .select('matuasach')
    .ilike('tentuasach', `%${q}%`)
    .limit(100);
  const tuasachIds = (titles || []).map((t) => t.matuasach);

  // Step 2: build OR filter across sach columns + tuasach FK
  const orParts = [];
  if (tuasachIds.length > 0) orParts.push(`matuasach.in.(${tuasachIds.join(',')})`);
  orParts.push(`nhaxb.ilike.%${q}%`);
  if (!isNaN(numQ)) orParts.push(`masach.eq.${numQ}`);

  let query = supabase
    .from('sach')
    .select('masach, matuasach, namxb, nhaxb, trangthai, tuasach(tentuasach, anhbia)')
    .eq('trangthai', TRANG_THAI.CO_SAN)
    .limit(limit);

  if (orParts.length > 0) query = query.or(orParts.join(','));

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const findAvailableByTuaSach = async (maTuaSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('masach, namxb, nhaxb, trigia')
    .eq('matuasach', maTuaSach)
    .eq('trangthai', TRANG_THAI.CO_SAN);
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, trangthai: payload.trangthai || TRANG_THAI.CO_SAN })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const update = async (maSach, payload) => {
  const { data, error } = await supabase
    .from(TABLE).update(payload).eq('masach', maSach).select().single();
  if (error) throw error;
  return data;
};

const setTrangThai = async (maSach, trangThai) => {
  const { data, error } = await supabase
    .from(TABLE).update({ trangthai: trangThai }).eq('masach', maSach).select('masach, trangthai').single();
  if (error) throw error;
  return data;
};

const remove = async (maSach) => {
  const { error } = await supabase.from(TABLE).delete().eq('masach', maSach);
  if (error) throw error;
};

/**
 * Bulk-insert an array of book copy records.
 * Each item: { matuasach, namxb, nhaxb?, ngaynhap, trigia }
 * Returns { inserted, errors } where errors lists rows that failed validation.
 */
const bulkCreate = async (rows) => {
  const currentYear = new Date().getFullYear();
  const valid = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-based + header row
    const { matuasach, namxb, nhaxb, ngaynhap, trigia } = row;

    if (!matuasach) return errors.push({ row: rowNum, reason: 'matuasach là bắt buộc' });
    if (!namxb) return errors.push({ row: rowNum, reason: 'namxb là bắt buộc' });
    if (!ngaynhap) return errors.push({ row: rowNum, reason: 'ngaynhap là bắt buộc' });
    if (trigia === undefined || trigia === null || trigia === '') return errors.push({ row: rowNum, reason: 'trigia là bắt buộc' });
    if (+namxb > currentYear) return errors.push({ row: rowNum, reason: `namxb (${namxb}) lớn hơn năm hiện tại` });
    if (+trigia < 0) return errors.push({ row: rowNum, reason: 'trigia không được âm' });

    valid.push({
      matuasach: +matuasach,
      namxb: +namxb,
      nhaxb: nhaxb || null,
      ngaynhap: String(ngaynhap).trim(),
      trigia: +trigia,
      trangthai: TRANG_THAI.CO_SAN,
    });
  });

  if (valid.length === 0) return { inserted: [], errors };

  const { data, error } = await supabase.from(TABLE).insert(valid).select();
  if (error) throw error;
  return { inserted: data, errors };
};

module.exports = { findById, findAll, search, findAvailableByTuaSach, create, bulkCreate, update, setTrangThai, remove, TRANG_THAI };

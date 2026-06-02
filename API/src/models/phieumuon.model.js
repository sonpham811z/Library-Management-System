// Model: PHIEUMUON (Phiếu Mượn / Borrow Slip)
// Table: phieumuon | PK: maphieumuon
const supabase = require('../config/supabase');

const TABLE = 'phieumuon';

const findById = async (maPhieuMuon) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      docgia(hoten, email),
      ct_phieumuon(
        masach,
        tentuasach_snapshot,
        anhbia_snapshot,
        nhaxb_snapshot,
        namxb_snapshot,
        sach(matuasach, trangthai, namxb, nhaxb, tuasach(tentuasach, anhbia))
      )
    `)
    .eq('maphieumuon', maPhieuMuon)
    .single();
  if (error) throw error;
  return data;
};

const SELECT_LIST = `
  maphieumuon, madocgia, ngaymuon, hantra,
  docgia(hoten),
  ct_phieumuon(
    masach,
    tentuasach_snapshot,
    anhbia_snapshot,
    nhaxb_snapshot,
    namxb_snapshot,
    sach(matuasach, trangthai, tuasach(tentuasach, anhbia))
  )
`;

const computeRowStatus = (row) => {
  const books = row.ct_phieumuon || [];
  if (books.length === 0) return null;
  const allReturned = books.every(
    (b) => b.sach?.trangthai === 'Có sẵn' || b.sach?.trangthai === 'Đang giữ chỗ'
  );
  if (allReturned) return 'Đã trả';
  if (new Date(row.hantra) < new Date()) return 'Quá hạn';
  return 'Đang mượn';
};

const findAll = async ({ page = 1, limit = 20, maDocGia, search, trangThai } = {}) => {
  // Resolve search: by phieumuon ID (numeric) or by docgia name
  let phieumuonId = null;
  let docgiaIds   = null;

  if (search) {
    const asInt = parseInt(search, 10);
    if (!isNaN(asInt)) {
      phieumuonId = asInt;
    } else {
      const { data: readers } = await supabase
        .from('docgia')
        .select('madocgia')
        .ilike('hoten', `%${search}%`)
        .limit(100);
      docgiaIds = (readers || []).map((r) => r.madocgia);
      if (docgiaIds.length === 0) return { data: [], count: 0 };
    }
  }

  const buildBase = (withCount) => {
    let q = supabase.from(TABLE).select(SELECT_LIST, withCount ? { count: 'exact' } : undefined);
    if (maDocGia)        q = q.eq('madocgia', maDocGia);
    if (phieumuonId !== null) q = q.eq('maphieumuon', phieumuonId);
    if (docgiaIds)       q = q.in('madocgia', docgiaIds);
    return q;
  };

  // When filtering by derived status: fetch all matching rows, filter in JS, paginate manually
  if (trangThai) {
    const { data: allData, error } = await buildBase(false).order('maphieumuon', { ascending: false });
    if (error) throw error;
    const filtered = (allData || []).filter((row) => computeRowStatus(row) === trangThai);
    const count    = filtered.length;
    const from     = (page - 1) * limit;
    return { data: filtered.slice(from, from + limit), count };
  }

  // Normal server-side pagination
  const from = (page - 1) * limit;
  const { data, error, count } = await buildBase(true)
    .range(from, from + limit - 1)
    .order('maphieumuon', { ascending: false });
  if (error) throw error;
  return { data, count };
};

const create = async ({ madocgia, ngaymuon, hantra }) => {
  const { data, error } = await supabase
    .from(TABLE).insert({ madocgia, ngaymuon, hantra }).select().single();
  if (error) throw error;
  return data;
};

/**
 * Update a phieumuon record.
 * Currently only HanTra (due date) can be changed after creation.
 * @param {number} maPhieuMuon
 * @param {{ hantra?: string }} payload
 */
const update = async (maPhieuMuon, payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('maphieumuon', maPhieuMuon)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const remove = async (maPhieuMuon) => {
  const { error } = await supabase.from(TABLE).delete().eq('maphieumuon', maPhieuMuon);
  if (error) throw error;
};

module.exports = { findById, findAll, create, update, remove };

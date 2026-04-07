// Model: DATCHO (Đặt Chỗ / Book Reservation)
// Table: datcho | PK: madatcho
// TrangThai: 'Đang chờ' | 'Đã có sách' | 'Đã hủy' | 'Hoàn tất'
const supabase = require('../config/supabase');

const TABLE = 'datcho';

const TRANG_THAI = {
  DANG_CHO:   'Đang chờ',
  DA_CO_SACH: 'Đã có sách',
  DA_HUY:     'Đã hủy',
  HOAN_TAT:   'Hoàn tất',
};

// ─── Select fragment used in all full queries ─────────────────────────────────
const FULL_SELECT =
  'madatcho, madocgia, matuasach, masach, ngaydatcho, ngayhethan, trangthai, ' +
  'docgia(hoten, email), tuasach(tentuasach, anhbia)';

const findAll = async ({ page = 1, limit = 20, maDocGia, maTuaSach, trangThai } = {}) => {
  let query = supabase
    .from(TABLE)
    .select(FULL_SELECT, { count: 'exact' });

  if (maDocGia)  query = query.eq('madocgia',  maDocGia);
  if (maTuaSach) query = query.eq('matuasach', maTuaSach);
  if (trangThai) query = query.eq('trangthai', trangThai);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('madatcho', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

const findById = async (maDatCho) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(FULL_SELECT)
    .eq('madatcho', maDatCho)
    .single();
  if (error) throw error;
  return data;
};

const findByReader = async (maDocGia) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('madatcho, matuasach, masach, ngaydatcho, ngayhethan, trangthai, tuasach(tentuasach, anhbia)')
    .eq('madocgia', maDocGia)
    .order('madatcho', { ascending: false });
  if (error) throw error;
  return data || [];
};

/**
 * Find oldest pending ('Đang chờ') reservation for a tuasach.
 * Returns the single next-in-queue record or null.
 */
const findNextInQueue = async (maTuaSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('madatcho, madocgia, matuasach, ngaydatcho, docgia(hoten, email)')
    .eq('matuasach', maTuaSach)
    .eq('trangthai', TRANG_THAI.DANG_CHO)
    .order('ngaydatcho', { ascending: true }) // FIFO: oldest first
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Find all expired hold reservations:
 * trangthai = 'Đã có sách' AND ngayhethan < today
 */
const findExpiredHolds = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from(TABLE)
    .select('madatcho, madocgia, matuasach, masach, ngayhethan')
    .eq('trangthai', TRANG_THAI.DA_CO_SACH)
    .lt('ngayhethan', today);
  if (error) throw error;
  return data || [];
};

/** Check if a reader already has an active reservation for this tuasach */
const findActiveByReaderAndTitle = async (maDocGia, maTuaSach) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('madatcho, trangthai')
    .eq('madocgia', maDocGia)
    .eq('matuasach', maTuaSach)
    .in('trangthai', [TRANG_THAI.DANG_CHO, TRANG_THAI.DA_CO_SACH])
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async ({ madocgia, matuasach }) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      madocgia,
      matuasach,
      ngaydatcho: new Date().toISOString().split('T')[0],
      ngayhethan: null,
      trangthai:  TRANG_THAI.DANG_CHO,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

/**
 * Assign a book to a reservation when it is returned.
 * Sets: masach, trangthai = 'Đã có sách', ngayhethan = today + thoiHanGiuSach days.
 */
const assignBook = async (maDatCho, maSach, thoiHanGiuSach) => {
  const today = new Date();
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + thoiHanGiuSach);
  const ngayhethan = deadline.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(TABLE)
    .update({ masach: maSach, trangthai: TRANG_THAI.DA_CO_SACH, ngayhethan })
    .eq('madatcho', maDatCho)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateTrangThai = async (maDatCho, trangThai, extra = {}) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ trangthai: trangThai, ...extra })
    .eq('madatcho', maDatCho)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Reader-owned cancel — verifies ownership */
const cancel = async (maDatCho, maDocGia) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ trangthai: TRANG_THAI.DA_HUY })
    .eq('madatcho', maDatCho)
    .eq('madocgia', maDocGia)
    .in('trangthai', [TRANG_THAI.DANG_CHO]) // can only cancel 'Đang chờ' (not holds)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  findAll, findById, findByReader,
  findNextInQueue, findExpiredHolds, findActiveByReaderAndTitle,
  create, assignBook, updateTrangThai, cancel,
  TRANG_THAI,
};

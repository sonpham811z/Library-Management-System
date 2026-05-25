/**
 * report.service.js
 * Business logic for generating and storing the two statistical reports:
 *   1. generateMuonSach(thang, nam)  — BCTINHHINHMUONSACH + CT_BCTINHHINHMUONSACH
 *   2. generateSachTraTre()          — BCSACHTRATRE      + CT_BCSACHTRATRE
 */

const supabase            = require('../config/supabase');
const bcMuonSachModel     = require('../models/bctinhhinhmuonsach.model');
const ctBcMuonSachModel   = require('../models/ct_bctinhhinhmuonsach.model');
const bcSachTraTreModel   = require('../models/bcsachtratre.model');
const ctBcSachTraTreModel = require('../models/ct_bcsachtratre.model');
const { TRANG_THAI_SACH } = require('../config/constants');

const todayStr = () => new Date().toISOString().split('T')[0];

/** Full days that today is past the deadline (0 if on time). */
const calcOverdueDays = (deadline) => {
  const dl  = new Date(deadline);
  const now = new Date(todayStr());
  dl.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  if (now <= dl) return 0;
  return Math.ceil((now - dl) / (1000 * 60 * 60 * 24));
};

// ─── 1. BCTINHHINHMUONSACH ────────────────────────────────────────────────────

/**
 * Generates (or regenerates) a monthly borrow report.
 * Counts CT_PHIEUMUON rows (individual books borrowed) grouped by THELOAI
 * for all PHIEUMUON whose NgayMuon falls within the given month/year.
 *
 * @param {number} thang  1–12
 * @param {number} nam    e.g. 2025
 * @returns The saved BCTINHHINHMUONSACH row with its CT details.
 */
const generateMuonSach = async (thang, nam) => {
  // Build date range for the month
  const mm      = String(thang).padStart(2, '0');
  const lastDay = new Date(nam, thang, 0).getDate(); // day 0 of next month = last of this
  const dateFrom = `${nam}-${mm}-01`;
  const dateTo   = `${nam}-${mm}-${String(lastDay).padStart(2, '0')}`;

  // Step 1: Get all PHIEUMUON in that month
  const { data: phieumuons, error: e1 } = await supabase
    .from('phieumuon')
    .select('maphieumuon')
    .gte('ngaymuon', dateFrom)
    .lte('ngaymuon', dateTo);
  if (e1) throw e1;

  const phieumuonIds = (phieumuons || []).map((p) => p.maphieumuon);

  // Step 2: Get CT_PHIEUMUON → SACH → TUASACH → THELOAI for those slips
  const categoryMap = {}; // { matheloai: { tentheloai, count } }

  if (phieumuonIds.length > 0) {
    const { data: ctItems, error: e2 } = await supabase
      .from('ct_phieumuon')
      .select('masach, sach(matuasach, tuasach(matheloai, theloai(tentheloai)))')
      .in('maphieumuon', phieumuonIds);
    if (e2) throw e2;

    for (const ct of ctItems || []) {
      const matheloai  = ct.sach?.tuasach?.matheloai;
      const tentheloai = ct.sach?.tuasach?.theloai?.tentheloai ?? 'Không rõ';
      if (!matheloai) continue;
      if (!categoryMap[matheloai]) categoryMap[matheloai] = { tentheloai, count: 0 };
      categoryMap[matheloai].count += 1;
    }
  }

  // Step 3: Compute total and percentages
  const tongSo = Object.values(categoryMap).reduce((s, v) => s + v.count, 0);

  // Step 4: Upsert header
  const header = await bcMuonSachModel.findOrCreate(thang, nam);
  await bcMuonSachModel.updateTongSo(header.mabaocao, tongSo);

  // Step 5: Upsert each category detail row
  const detailPromises = Object.entries(categoryMap).map(([matheloai, { count }]) => {
    const tile = tongSo > 0 ? parseFloat(((count / tongSo) * 100).toFixed(2)) : 0;
    return ctBcMuonSachModel.upsertDetail(header.mabaocao, +matheloai, count, tile);
  });
  await Promise.all(detailPromises);

  // Step 6: Return full report with details
  return bcMuonSachModel.findById(header.mabaocao);
};

// ─── 2. BCSACHTRATRE ─────────────────────────────────────────────────────────

/**
 * Generates a snapshot of all currently overdue books (still borrowed, past deadline).
 * Creates a new BCSACHTRATRE row dated today and inserts CT details.
 *
 * @returns The saved BCSACHTRATRE row with its CT details.
 */
const generateSachTraTre = async () => {
  const today = todayStr();

  // Step 1: Get all PHIEUMUON where HanTra < today
  const { data: overduePM, error: e1 } = await supabase
    .from('phieumuon')
    .select('maphieumuon, hantra')
    .lt('hantra', today);
  if (e1) throw e1;

  if (!overduePM || overduePM.length === 0) {
    const header = await bcSachTraTreModel.create(today);
    return bcSachTraTreModel.findById(header.mabaocao);
  }

  const pmIds     = overduePM.map((p) => p.maphieumuon);
  const hanTraMap = {};
  overduePM.forEach((p) => { hanTraMap[p.maphieumuon] = p.hantra; });

  // Step 2: Get CT_PHIEUMUON → SACH; keep only books that are still borrowed (not yet returned)
  const { data: ctItems, error: e2 } = await supabase
    .from('ct_phieumuon')
    .select('masach, maphieumuon, sach(trangthai)')
    .in('maphieumuon', pmIds);
  if (e2) throw e2;

  const stillBorrowed = (ctItems || []).filter(
    (ct) => ct.sach?.trangthai === TRANG_THAI_SACH.DA_MUON
  );

  // Step 3: Build detail rows with SoNgayTraTre
  const details = stillBorrowed.map((ct) => ({
    masach:       ct.masach,
    songaytratre: calcOverdueDays(hanTraMap[ct.maphieumuon]),
  }));

  // Step 4: Create report header then insert details
  const header = await bcSachTraTreModel.create(today);
  if (details.length > 0) {
    await ctBcSachTraTreModel.addMany(header.mabaocao, details);
  }

  return bcSachTraTreModel.findById(header.mabaocao);
};

// ─── 3. DASHBOARD STATS ───────────────────────────────────────────────────────

const getDashboardStats = async () => {
  const { count: totalBooks } = await supabase
    .from('sach').select('*', { count: 'exact', head: true });

  const { count: totalReaders } = await supabase
    .from('docgia').select('*', { count: 'exact', head: true });

  const { count: activeBorrows } = await supabase
    .from('sach').select('*', { count: 'exact', head: true })
    .eq('trangthai', 'Đã mượn');

  const { data: fineRows } = await supabase
    .from('phieuthutienphat').select('sotienthu');
  const totalFineCollected = (fineRows || []).reduce((s, r) => s + Number(r.sotienthu), 0);

  // Monthly borrows: last 12 months
  const monthlyBorrows = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();
    const mm    = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    const from = `${year}-${mm}-01`;
    const to   = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
    const { count } = await supabase
      .from('phieumuon').select('*', { count: 'exact', head: true })
      .gte('ngaymuon', from).lte('ngaymuon', to);
    monthlyBorrows.push({ month: `${month}/${year}`, count: count || 0 });
  }

  return { totalBooks, totalReaders, activeBorrows, totalFineCollected, monthlyBorrows };
};

// ─── 4. BORROW BY CATEGORY (date range) ──────────────────────────────────────

const getBorrowByCategory = async (from, to) => {
  const { data: phieumuons } = await supabase
    .from('phieumuon').select('maphieumuon')
    .gte('ngaymuon', from).lte('ngaymuon', to);
  if (!phieumuons || phieumuons.length === 0) return [];

  const ids = phieumuons.map((p) => p.maphieumuon);
  const { data: ctItems } = await supabase
    .from('ct_phieumuon')
    .select('sach(tuasach(matheloai, theloai(tentheloai)))')
    .in('maphieumuon', ids);

  const map = {};
  for (const ct of ctItems || []) {
    const matheloai  = ct.sach?.tuasach?.matheloai;
    const tentheloai = ct.sach?.tuasach?.theloai?.tentheloai ?? 'Không rõ';
    if (!matheloai) continue;
    if (!map[matheloai]) map[matheloai] = { tentheloai, count: 0 };
    map[matheloai].count += 1;
  }
  const total = Object.values(map).reduce((s, v) => s + v.count, 0);
  return Object.entries(map).map(([id, { tentheloai, count }]) => ({
    matheloai: +id, tentheloai, count,
    tile: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
  }));
};

// ─── 5. OVERDUE REPORT ────────────────────────────────────────────────────────

const getOverdueReport = async (from, to) => {
  const today = todayStr();
  const { data: overduePM } = await supabase
    .from('phieumuon').select('maphieumuon, hantra, madocgia, docgia(hoten)')
    .lt('hantra', today)
    .gte('ngaymuon', from).lte('ngaymuon', to);

  const pmIds = (overduePM || []).map((p) => p.maphieumuon);
  if (pmIds.length === 0) return [];

  const { data: ctItems } = await supabase
    .from('ct_phieumuon')
    .select('masach, maphieumuon, sach(trangthai, tuasach(tentuasach))')
    .in('maphieumuon', pmIds);

  const hanTraMap = {};
  const docgiaMap = {};
  (overduePM || []).forEach((p) => {
    hanTraMap[p.maphieumuon] = p.hantra;
    docgiaMap[p.maphieumuon] = { madocgia: p.madocgia, hoten: p.docgia?.hoten ?? '—' };
  });

  return (ctItems || [])
    .filter((ct) => ct.sach?.trangthai === 'Đã mượn')
    .map((ct) => {
      const pm = docgiaMap[ct.maphieumuon];
      const dl = new Date(hanTraMap[ct.maphieumuon]);
      const now = new Date(today);
      dl.setHours(0,0,0,0); now.setHours(0,0,0,0);
      const soNgayTraTre = Math.max(0, Math.ceil((now - dl) / 86400000));
      return {
        masach: ct.masach,
        tentuasach: ct.sach?.tuasach?.tentuasach ?? '—',
        madocgia: pm?.madocgia,
        hoten: pm?.hoten,
        hantra: hanTraMap[ct.maphieumuon],
        songaytratre: soNgayTraTre,
      };
    });
};

module.exports = { generateMuonSach, generateSachTraTre, getDashboardStats, getBorrowByCategory, getOverdueReport };

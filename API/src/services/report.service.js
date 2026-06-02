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

// ─── 6. REVENUE (doanh thu tiền phạt) ────────────────────────────────────────

const getRevenue = async ({ type, date, month, year }) => {
  let from, to;

  if (type === 'day') {
    if (!date) throw new Error('date là bắt buộc khi type=day');
    from = date;
    to = date;
  } else if (type === 'month') {
    if (!month || !year) throw new Error('month và year là bắt buộc khi type=month');
    const mm = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    from = `${year}-${mm}-01`;
    to   = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
  } else if (type === 'year') {
    if (!year) throw new Error('year là bắt buộc khi type=year');
    from = `${year}-01-01`;
    to   = `${year}-12-31`;
  } else {
    throw new Error('type phải là day, month hoặc year');
  }

  const { data, error } = await supabase
    .from('phieuthutienphat')
    .select('ngaythu, sotienthu')
    .gte('ngaythu', from)
    .lte('ngaythu', to);
  if (error) throw error;
  const rows = data || [];

  // Build ordered labels
  let labels = [];
  if (type === 'day') {
    labels = [date];
  } else if (type === 'month') {
    const lastDay = new Date(year, month, 0).getDate();
    for (let i = 1; i <= lastDay; i++) labels.push(String(i).padStart(2, '0'));
  } else {
    for (let i = 1; i <= 12; i++) labels.push(`${i}/${year}`);
  }

  // Aggregate by label key
  const map = {};
  for (const row of rows) {
    let key;
    if (type === 'day') {
      key = row.ngaythu;
    } else if (type === 'month') {
      key = row.ngaythu.split('-')[2]; // "DD"
    } else {
      const m = parseInt(row.ngaythu.split('-')[1], 10);
      key = `${m}/${year}`;
    }
    map[key] = (map[key] || 0) + Number(row.sotienthu);
  }

  const chartData = labels.map((label) => ({ label, amount: map[label] || 0 }));
  const total = rows.reduce((s, r) => s + Number(r.sotienthu), 0);
  return { total, chartData };
};

// ─── 7. BORROW TREND (by day / month / year) ─────────────────────────────────

const getBorrowTrend = async ({ type, from, to, year }) => {
  let rows, chartData;

  if (type === 'day') {
    if (!from || !to) throw new Error('from và to là bắt buộc khi type=day');
    const { data, error } = await supabase
      .from('phieumuon').select('ngaymuon')
      .gte('ngaymuon', from).lte('ngaymuon', to);
    if (error) throw error;
    rows = data || [];

    const map = {};
    const start = new Date(from + 'T00:00:00');
    const end   = new Date(to   + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map[d.toISOString().split('T')[0]] = 0;
    }
    for (const r of rows) {
      if (map[r.ngaymuon] !== undefined) map[r.ngaymuon]++;
    }
    chartData = Object.entries(map).map(([date, count]) => {
      const [, m, d] = date.split('-');
      return { label: `${d}/${m}`, count };
    });

  } else if (type === 'month') {
    if (!year) throw new Error('year là bắt buộc khi type=month');
    const { data, error } = await supabase
      .from('phieumuon').select('ngaymuon')
      .gte('ngaymuon', `${year}-01-01`).lte('ngaymuon', `${year}-12-31`);
    if (error) throw error;
    rows = data || [];

    const map = {};
    for (let m = 1; m <= 12; m++) map[m] = 0;
    for (const r of rows) {
      const m = parseInt(r.ngaymuon.split('-')[1], 10);
      if (map[m] !== undefined) map[m]++;
    }
    chartData = Object.entries(map).map(([m, count]) => ({ label: `T${m}`, count: +count }));

  } else if (type === 'year') {
    const { data, error } = await supabase.from('phieumuon').select('ngaymuon');
    if (error) throw error;
    rows = data || [];

    const map = {};
    for (const r of rows) {
      const y = r.ngaymuon.split('-')[0];
      map[y] = (map[y] || 0) + 1;
    }
    chartData = Object.entries(map)
      .sort(([a], [b]) => +a - +b)
      .map(([label, count]) => ({ label, count }));

  } else {
    throw new Error('type phải là day, month hoặc year');
  }

  const total = chartData.reduce((s, r) => s + r.count, 0);
  return { total, chartData };
};

module.exports = { generateMuonSach, generateSachTraTre, getDashboardStats, getBorrowByCategory, getOverdueReport, getRevenue, getBorrowTrend };

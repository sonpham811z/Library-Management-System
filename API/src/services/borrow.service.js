/**
 * borrow.service.js
 * Core business logic for:
 *   1. createPhieuMuon  — Borrow slip (PHIEUMUON + CT_PHIEUMUON)
 *   2. createPhieuTra   — Return slip (PHIEUTRA + CT_PHIEUTRA)
 *   3. createPhieuThu   — Fine collection (PHIEUTHUTIENPHAT)
 *   4. getActiveBorrows — Helper: active (unreturned) books for a reader
 */

const supabase           = require('../config/supabase');
const thamsoModel        = require('../models/thamso.model');
const docgiaModel        = require('../models/docgia.model');
const sachModel          = require('../models/sach.model');
const phieumuonModel     = require('../models/phieumuon.model');
const ctPhieuMuonModel   = require('../models/ct_phieumuon.model');
const phieutraModel      = require('../models/phieutra.model');
const ctPhieuTraModel    = require('../models/ct_phieutra.model');
const phieuthuModel      = require('../models/phieuthutienphat.model');
const datchoModel        = require('../models/datcho.model');
const { THAMSO, TRANG_THAI_SACH } = require('../config/constants');

// Prevent concurrent return-slip creation for the same reader in one API instance.
const phieuTraCreationLocks = new Set();

// ─── Internal helpers ─────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

/** Full days that returnDate is past deadline. Returns 0 if on time. */
const calcOverdueDays = (deadline, returnDate) => {
  const dl  = new Date(deadline);
  const ret = new Date(returnDate);
  dl.setHours(0, 0, 0, 0);
  ret.setHours(0, 0, 0, 0);
  if (ret <= dl) return 0;
  return Math.ceil((ret - dl) / (1000 * 60 * 60 * 24));
};

// ─── getActiveBorrows ─────────────────────────────────────────────────────���───
/**
 * Returns books that are still unreturned for this reader.
 * A book is considered active when the pair (maphieumuon, masach)
 * has no matching line in CT_PHIEUTRA.
 */
const getActiveBorrows = async (madocgia, tienPhatNgay = null) => {
  // Step 1: all PHIEUMUON for this reader
  const { data: phieumuons, error: e1 } = await supabase
    .from('phieumuon')
    .select('maphieumuon, ngaymuon, hantra')
    .eq('madocgia', madocgia);
  if (e1) throw e1;
  if (!phieumuons || phieumuons.length === 0) return [];

  const phieumuonIds = phieumuons.map((p) => p.maphieumuon);

  // Step 2: CT_PHIEUMUON for those slips + book metadata
  const { data: ctItems, error: e2 } = await supabase
    .from('ct_phieumuon')
    .select('masach, maphieumuon, sach(tuasach(tentuasach, anhbia))')
    .in('maphieumuon', phieumuonIds);
  if (e2) throw e2;

  // Step 3: read returned lines and exclude already-returned borrow-detail pairs
  const { data: returnedItems, error: e3 } = await supabase
    .from('ct_phieutra')
    .select('maphieumuon, masach')
    .in('maphieumuon', phieumuonIds);
  if (e3) throw e3;

  const returnedPairSet = new Set(
    (returnedItems || []).map((it) => `${it.maphieumuon}:${it.masach}`)
  );

  const active = (ctItems || []).filter(
    (ct) => !returnedPairSet.has(`${ct.maphieumuon}:${ct.masach}`)
  );

  if (tienPhatNgay === null) {
    const thamso = await thamsoModel.getAsMap();
    tienPhatNgay = Number(thamso[THAMSO.TIEN_PHAT_MOT_NGAY] ?? 0);
  }

  const today = todayStr();
  return active.map((ct) => {
    const pm            = phieumuons.find((p) => p.maphieumuon === ct.maphieumuon);
    const soNgayTraTre  = calcOverdueDays(pm.hantra, today);
    const tienPhat      = soNgayTraTre * tienPhatNgay;
    return {
      masach:            ct.masach,
      maphieumuon:       ct.maphieumuon,
      ngaymuon:          pm.ngaymuon,
      hantra:            pm.hantra,
      tentuasach:        ct.sach?.tuasach?.tentuasach ?? '—',
      anhbia:            ct.sach?.tuasach?.anhbia ?? null,
      songaytratre_est:  soNgayTraTre,
      tienphat_est:      tienPhat,
      is_overdue:        soNgayTraTre > 0,
    };
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. CREATE PHIEUMUON
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Rules (all parameters from THAMSO):
 *  ① DOCGIA.NgayHetHan >= today          (card not expired)
 *  ② No currently-overdue books
 *  ③ current_borrows + new_borrows <= SoSachMuonToiDa
 *  ④ Each SACH.TrangThai = 'Có sẵn'
 *  ⑤ No duplicate masach in list
 */
const createPhieuMuon = async (madocgia, masachlist) => {
  if (!masachlist || masachlist.length === 0) {
    throw { statusCode: 400, message: 'Danh sách sách mượn không được rỗng' };
  }

  // ⑤ Dedup
  const uniqueList = [...new Set(masachlist.map(Number))];
  if (uniqueList.length !== masachlist.length) {
    throw { statusCode: 400, message: 'Danh sách sách mượn có mã trùng nhau' };
  }

  // ── THAMSO ────────────────────────────────────────────────────────────────
  const thamso       = await thamsoModel.getAsMap();
  const soNgayMuon   = Number(thamso[THAMSO.SO_NGAY_MUON_TOI_DA]);
  const soSachToiDa  = Number(thamso[THAMSO.SO_SACH_MUON_TOI_DA]);
  const tienPhatNgay = Number(thamso[THAMSO.TIEN_PHAT_MOT_NGAY] ?? 0);

  if (!soNgayMuon || !soSachToiDa) {
    throw { statusCode: 500, message: 'Thiếu cấu hình THAMSO (SoNgayMuonToiDa, SoSachMuonToiDa)' };
  }

  // ① Card expiry
  const docgia = await docgiaModel.findById(madocgia);
  const today  = todayStr();
  if (new Date(docgia.ngayhethan) < new Date(today)) {
    throw {
      statusCode: 400,
      message: `Thẻ độc giả "${docgia.hoten}" đã hết hạn ngày ${docgia.ngayhethan}. Vui lòng gia hạn trước.`,
    };
  }

  // ② Overdue check  ③ Count limit
  const activeBorrows = await getActiveBorrows(madocgia, tienPhatNgay);
  const overdueBooks  = activeBorrows.filter((b) => b.is_overdue);

  if (overdueBooks.length > 0) {
    const titles = overdueBooks.map((b) => `"${b.tentuasach}"`).join(', ');
    throw {
      statusCode: 400,
      message: `Độc giả còn ${overdueBooks.length} sách quá hạn: ${titles}. Vui lòng trả trước khi mượn mới.`,
    };
  }

  const currentCount = activeBorrows.length;
  if (currentCount + uniqueList.length > soSachToiDa) {
    throw {
      statusCode: 400,
      message: `Đang mượn ${currentCount} quyển (tối đa ${soSachToiDa}). Chỉ có thể mượn thêm ${soSachToiDa - currentCount} quyển.`,
    };
  }

  // ④ Book availability + collect snapshot data
  const sachWithSnapshots = [];
  for (const maSach of uniqueList) {
    const sach = await sachModel.findById(maSach);
    if (sach.trangthai !== TRANG_THAI_SACH.CO_SAN) {
      throw {
        statusCode: 409,
        message: `Sách #${maSach} "${sach.tuasach?.tentuasach || ''}" hiện không có sẵn (${sach.trangthai}).`,
      };
    }
    // Capture snapshot to protect borrow history from future book edits
    sachWithSnapshots.push({
      masach:              maSach,
      tentuasach_snapshot: sach.tuasach?.tentuasach || null,
      anhbia_snapshot:     sach.tuasach?.anhbia     || null,
      nhaxb_snapshot:      sach.nhaxb               || null,
      namxb_snapshot:      sach.namxb               || null,
    });
  }

  // ── Create records ─────────────────────────────────────────────────────────
  const hanTra    = addDays(today, soNgayMuon);
  const phieumuon = await phieumuonModel.create({ madocgia, ngaymuon: today, hantra: hanTra });

  await ctPhieuMuonModel.addMany(phieumuon.maphieumuon, sachWithSnapshots);

  for (const maSach of uniqueList) {
    await sachModel.setTrangThai(maSach, TRANG_THAI_SACH.DA_MUON);
  }

  const full = await phieumuonModel.findById(phieumuon.maphieumuon);
  return { ...full, so_ngay_muon: soNgayMuon };
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. CREATE PHIEUTRA
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Logic:
 *  - Each SACH must be borrowed by this reader
 *  - SoNgayTraTre = max(0, today − HanTra)
 *  - TienPhat/book = SoNgayTraTre × TienPhatTreHanMotNgay
 *  - DOCGIA.TienNo += TongTienPhat
 *  - SACH.TrangThai → 'Có sẵn'
 */
const createPhieuTra = async (madocgia, masachlist) => {
  if (phieuTraCreationLocks.has(madocgia)) {
    throw {
      statusCode: 409,
      message: 'Đang xử lý phiếu trả cho độc giả này. Vui lòng đợi trong giây lát và thử lại.',
    };
  }
  phieuTraCreationLocks.add(madocgia);

  try {
    if (!masachlist || masachlist.length === 0) {
      throw { statusCode: 400, message: 'Danh sách sách trả không được rỗng' };
    }

    const uniqueList = [...new Set(masachlist.map(Number))];

    const thamso       = await thamsoModel.getAsMap();
    const tienPhatNgay = Number(thamso[THAMSO.TIEN_PHAT_MOT_NGAY] ?? 0);

    // Validate: each book must be actively borrowed by this reader
    const activeBorrows = await getActiveBorrows(madocgia, tienPhatNgay);
    const activeMap     = new Map(activeBorrows.map((b) => [b.masach, b]));

    const today      = todayStr();
    let tongTienPhat = 0;
    const ctDetails  = [];

    for (const maSach of uniqueList) {
      const active = activeMap.get(maSach);
      if (!active) {
        throw {
          statusCode: 400,
          message: `Sách #${maSach} không thuộc danh sách đang mượn của độc giả này.`,
        };
      }
      const soNgayTraTre = calcOverdueDays(active.hantra, today);
      const tienPhat     = soNgayTraTre * tienPhatNgay;
      tongTienPhat      += tienPhat;
      ctDetails.push({ maphieumuon: active.maphieumuon, masach: maSach, songaytratre: soNgayTraTre, tienphat: tienPhat });
    }

    // ── Create PHIEUTRA ────────────────────────────────────────────────────────
    const phieutra = await phieutraModel.create({
      madocgia,
      ngaytra:        today,
      tienphatkynay: tongTienPhat,
    });

    await ctPhieuTraModel.addMany(phieutra.maphieutra, ctDetails);

    // ── Accumulate debt ────────────────────────────────────────────────────────
    if (tongTienPhat > 0) {
      await docgiaModel.adjustTienNo(madocgia, tongTienPhat);
    }

    // ── Release books — check reservations before setting status ─────────────
    const thoiHanGiuSach = Number(thamso[THAMSO.THOI_HAN_GIU_SACH] ?? 3);
    const notifiedReservations = [];

    for (const maSach of uniqueList) {
      const sach = await sachModel.findById(maSach);
      const maTuaSach = sach?.matuasach;

      // Is there a queued reservation for this title?
      const nextInQueue = maTuaSach
        ? await datchoModel.findNextInQueue(maTuaSach)
        : null;

      if (nextInQueue) {
        // Assign the returned book to the reservation; hold the book
        await datchoModel.assignBook(nextInQueue.madatcho, maSach, thoiHanGiuSach);
        await sachModel.setTrangThai(maSach, TRANG_THAI_SACH.DANG_GIU_CHO);

        notifiedReservations.push({
          madatcho:  nextInQueue.madatcho,
          madocgia:  nextInQueue.madocgia,
          hoten:     nextInQueue.docgia?.hoten,
          email:     nextInQueue.docgia?.email,
          matuasach: maTuaSach,
          masach:    maSach,
        });
      } else {
        // No reservation — release normally
        await sachModel.setTrangThai(maSach, TRANG_THAI_SACH.CO_SAN);
      }
    }

    const full = await phieutraModel.findById(phieutra.maphieutra);
    return { ...full, ct_details: ctDetails, tong_tien_phat: tongTienPhat, notified_reservations: notifiedReservations };
  } finally {
    phieuTraCreationLocks.delete(madocgia);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. CREATE PHIEUTHUTIENPHAT
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Rules:
 *  - SoTienThu > 0
 *  - SoTienThu ≤ DOCGIA.TienNo
 *  - DOCGIA.TienNo -= SoTienThu
 */
const createPhieuThu = async (madocgia, sotienthu) => {
  const amount = Number(sotienthu);
  if (!amount || amount <= 0) {
    throw { statusCode: 400, message: 'Số tiền thu phải lớn hơn 0' };
  }

  const docgia = await docgiaModel.findById(madocgia);
  const tienno = Number(docgia.tienno);

  if (tienno <= 0) {
    throw { statusCode: 400, message: `Độc giả "${docgia.hoten}" không có nợ phạt` };
  }
  if (amount > tienno) {
    throw {
      statusCode: 400,
      message: `Số tiền thu (${amount.toLocaleString('vi-VN')} đ) vượt quá tổng nợ (${tienno.toLocaleString('vi-VN')} đ)`,
    };
  }

  const conlai   = tienno - amount;
  const ngaythu  = todayStr();

  const phieuthu = await phieuthuModel.create({ madocgia, ngaythu, sotienthu: amount, conlai });

  await docgiaModel.adjustTienNo(madocgia, -amount);

  return { ...phieuthu, hoten_docgia: docgia.hoten, tienno_truoc: tienno, tienno_sau: conlai };
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. CONFIRM RESERVATION → Create a loan for the reserved book
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Converts a 'Đã có sách' reservation into a PHIEUMUON.
 * Validates: reservation exists, not expired, masach assigned, card valid.
 */
const confirmReservation = async (maDatCho) => {
  const reservation = await datchoModel.findById(maDatCho);
  if (!reservation) throw { statusCode: 404, message: 'Không tìm thấy lượt đặt trước' };
  if (reservation.trangthai !== datchoModel.TRANG_THAI.DA_CO_SACH) {
    throw {
      statusCode: 400,
      message: `Lượt đặt trước đang ở trạng thái "${reservation.trangthai}", không thể xác nhận mượn.`,
    };
  }
  if (!reservation.masach) {
    throw { statusCode: 400, message: 'Chưa có bản sao được gán cho lượt đặt trước này' };
  }

  // Check expiry
  const today = todayStr();
  if (reservation.ngayhethan && reservation.ngayhethan < today) {
    throw {
      statusCode: 400,
      message: `Lượt đặt trước đã hết hạn giữ sách ngày ${reservation.ngayhethan}. Vui lòng đặt lại.`,
    };
  }

  // Validate card
  const docgia = await docgiaModel.findById(reservation.madocgia);
  if (new Date(docgia.ngayhethan) < new Date(today)) {
    throw {
      statusCode: 400,
      message: `Thẻ độc giả "${docgia.hoten}" đã hết hạn. Vui lòng gia hạn trước.`,
    };
  }

  // Fetch THAMSO for loan duration
  const thamso     = await thamsoModel.getAsMap();
  const soNgayMuon = Number(thamso[THAMSO.SO_NGAY_MUON_TOI_DA]);
  if (!soNgayMuon) throw { statusCode: 500, message: 'Thiếu cấu hình SoNgayMuonToiDa trong THAMSO' };

  // Create PHIEUMUON
  const hanTra    = addDays(today, soNgayMuon);
  const phieumuon = await phieumuonModel.create({
    madocgia: reservation.madocgia,
    ngaymuon: today,
    hantra:   hanTra,
  });

  await ctPhieuMuonModel.addMany(phieumuon.maphieumuon, [reservation.masach]);
  await sachModel.setTrangThai(reservation.masach, TRANG_THAI_SACH.DA_MUON);

  // Complete the reservation
  await datchoModel.updateTrangThai(maDatCho, datchoModel.TRANG_THAI.HOAN_TAT);

  const full = await phieumuonModel.findById(phieumuon.maphieumuon);
  return { ...full, so_ngay_muon: soNgayMuon, madatcho: maDatCho };
};

// ═════════════════════════════════════════════════════════════════════════════
// 6. AUTO-CANCEL EXPIRED HOLDS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Finds all 'Đã có sách' reservations past ngayhethan.
 * For each:
 *  1. Release the held book.
 *  2. Cancel the reservation.
 *  3. Assign the freed book to the next queued reader (FIFO), if any.
 * Returns a summary of what was cancelled and re-assigned.
 */
const autoCancelExpiredHolds = async () => {
  const expired = await datchoModel.findExpiredHolds();
  if (expired.length === 0) return { cancelled: 0, reassigned: 0, details: [] };

  const thamso         = await thamsoModel.getAsMap();
  const thoiHanGiuSach = Number(thamso[THAMSO.THOI_HAN_GIU_SACH] ?? 3);

  const details     = [];
  let reassignCount = 0;

  for (const hold of expired) {
    // Cancel this hold
    await datchoModel.updateTrangThai(hold.madatcho, datchoModel.TRANG_THAI.DA_HUY, { masach: null });

    // Find next in queue for the same title
    const next = await datchoModel.findNextInQueue(hold.matuasach);
    if (next) {
      // Re-assign the freed book to the next reader
      await datchoModel.assignBook(next.madatcho, hold.masach, thoiHanGiuSach);
      await sachModel.setTrangThai(hold.masach, TRANG_THAI_SACH.DANG_GIU_CHO);
      reassignCount++;
      details.push({ action: 'reassigned', from_madatcho: hold.madatcho, to_madatcho: next.madatcho, masach: hold.masach });
    } else {
      // No one in queue — free the book
      await sachModel.setTrangThai(hold.masach, TRANG_THAI_SACH.CO_SAN);
      details.push({ action: 'released', madatcho: hold.madatcho, masach: hold.masach });
    }
  }

  return { cancelled: expired.length, reassigned: reassignCount, details };
};

module.exports = {
  createPhieuMuon,
  createPhieuTra,
  createPhieuThu,
  confirmReservation,
  autoCancelExpiredHolds,
  getActiveBorrows,
};

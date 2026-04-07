const borrowService = require('../services/borrow.service');
const datchoModel   = require('../models/datcho.model');
const sachModel     = require('../models/sach.model');
const docgiaModel   = require('../models/docgia.model');
const thamsoModel   = require('../models/thamso.model');
const { THAMSO, TRANG_THAI_SACH } = require('../config/constants');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// ─── Shared helper: resolve the logged-in reader's DOCGIA record ──────────────
const resolveDocGia = async (user) => {
  let docgia = null;
  if (user.maNguoiDung) docgia = await docgiaModel.findByNguoiDung(user.maNguoiDung);
  if (!docgia)          docgia = await docgiaModel.findByEmail(user.tenDangNhap);
  return docgia;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/datcho  — ADMIN/STAFF: paginated list of all reservations
// ─────────────────────────────────────────────────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    // Run auto-cancel silently on every staff listing
    await borrowService.autoCancelExpiredHolds().catch(() => {});

    const { page = 1, limit = 20, madocgia, matuasach, trangthai } = req.query;
    const { data, count } = await datchoModel.findAll({
      page: +page, limit: +limit,
      maDocGia:  madocgia  ? +madocgia  : undefined,
      maTuaSach: matuasach ? +matuasach : undefined,
      trangThai: trangthai || undefined,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/datcho/my  — READER: own reservations (expired holds auto-cancelled)
// ─────────────────────────────────────────────────────────────────────────────
const getMy = async (req, res, next) => {
  try {
    await borrowService.autoCancelExpiredHolds().catch(() => {});

    const docgia = await resolveDocGia(req.user);
    if (!docgia) return sendSuccess(res, []);

    const data = await datchoModel.findByReader(docgia.madocgia);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/datcho  — READER: create a reservation
//
// Rules:
//  1. Reader's card must be valid (not expired).
//  2. ALL copies (SACH) of the TUASACH must be NOT 'Có sẵn'.
//     If any copy is available, reject with "borrow it normally" message.
//  3. No existing active (Đang chờ / Đã có sách) reservation for same title.
// ─────────────────────────────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { matuasach } = req.body;
    if (!matuasach) return sendError(res, 'matuasach là bắt buộc', 400);

    // Resolve reader card
    const docgia = await resolveDocGia(req.user);
    if (!docgia) return sendError(res, 'Không tìm thấy thẻ độc giả của bạn', 404);

    // Rule 1: card validity
    const today = new Date().toISOString().split('T')[0];
    if (docgia.ngayhethan < today) {
      return sendError(
        res,
        `Thẻ độc giả của bạn đã hết hạn ngày ${docgia.ngayhethan}. Vui lòng gia hạn thẻ trước khi đặt trước.`,
        400
      );
    }

    // Rule 2: all copies must be unavailable ('Đã mượn' or 'Đang giữ chỗ')
    const available = await sachModel.findAvailableByTuaSach(+matuasach);
    if (available.length > 0) {
      return sendError(
        res,
        `Hiện có ${available.length} bản sao đang còn sẵn. Vui lòng đến thư viện để mượn trực tiếp thay vì đặt trước.`,
        400
      );
    }

    // Rule 3: no duplicate active reservation
    const existing = await datchoModel.findActiveByReaderAndTitle(docgia.madocgia, +matuasach);
    if (existing) {
      return sendError(
        res,
        `Bạn đã có một lượt đặt trước "${existing.trangthai}" cho tựa sách này.`,
        409
      );
    }

    const reservation = await datchoModel.create({ madocgia: docgia.madocgia, matuasach: +matuasach });
    return sendSuccess(res, reservation, 'Đặt trước thành công. Chúng tôi sẽ thông báo khi sách được trả lại.', 201);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/datcho/:id/confirm  — Convert reservation → PHIEUMUON
//
// Called by STAFF when a reader comes in to pick up their held book.
// Delegates entirely to borrowService.confirmReservation.
// ─────────────────────────────────────────────────────────────────────────────
const confirmReservation = async (req, res, next) => {
  try {
    const result = await borrowService.confirmReservation(+req.params.id);
    return sendSuccess(
      res,
      result,
      `Xác nhận mượn thành công. Phiếu mượn #${result.maphieumuon} đã được lập.`,
      201
    );
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/datcho/:id/cancel  — Cancel a reservation
//
// READER: can only cancel own 'Đang chờ' reservations (not holds).
// ADMIN/STAFF: can cancel any reservation; if hold, also releases the book.
// ─────────────────────────────────────────────────────────────────────────────
const cancel = async (req, res, next) => {
  try {
    const maDatCho = +req.params.id;

    if (req.user.role === 'READER') {
      const docgia = await resolveDocGia(req.user);
      if (!docgia) return sendError(res, 'Không tìm thấy thẻ độc giả', 404);

      const result = await datchoModel.cancel(maDatCho, docgia.madocgia);
      if (!result) {
        return sendError(
          res,
          'Không tìm thấy lượt đặt trước hoặc bạn không thể hủy lúc này (chỉ hủy được khi đang chờ).',
          404
        );
      }
      return sendSuccess(res, result, 'Hủy đặt trước thành công');
    }

    // Staff/Admin: fetch full record to check if a held book needs releasing
    const reservation = await datchoModel.findById(maDatCho);
    if (!reservation) return sendError(res, 'Không tìm thấy lượt đặt trước', 404);
    if (reservation.trangthai === datchoModel.TRANG_THAI.HOAN_TAT) {
      return sendError(res, 'Không thể hủy lượt đặt trước đã hoàn tất', 400);
    }

    // Release held book if any, then check next in queue
    if (reservation.masach && reservation.trangthai === datchoModel.TRANG_THAI.DA_CO_SACH) {
      const thamso         = await thamsoModel.getAsMap();
      const thoiHanGiuSach = Number(thamso[THAMSO.THOI_HAN_GIU_SACH] ?? 3);

      const next = await datchoModel.findNextInQueue(reservation.matuasach);
      if (next && next.madatcho !== maDatCho) {
        await datchoModel.assignBook(next.madatcho, reservation.masach, thoiHanGiuSach);
        await sachModel.setTrangThai(reservation.masach, TRANG_THAI_SACH.DANG_GIU_CHO);
      } else {
        await sachModel.setTrangThai(reservation.masach, TRANG_THAI_SACH.CO_SAN);
      }
    }

    const result = await datchoModel.updateTrangThai(maDatCho, datchoModel.TRANG_THAI.DA_HUY, { masach: null });
    return sendSuccess(res, result, 'Hủy đặt trước thành công');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/datcho/auto-cancel  — ADMIN/STAFF: trigger auto-cancel manually
// ─────────────────────────────────────────────────────────────────────────────
const autoCancelExpired = async (req, res, next) => {
  try {
    const result = await borrowService.autoCancelExpiredHolds();
    return sendSuccess(
      res,
      result,
      `Đã xử lý ${result.cancelled} lượt đặt trước hết hạn. Tái phân bổ: ${result.reassigned}.`
    );
  } catch (err) { next(err); }
};

module.exports = { getAll, getMy, create, confirmReservation, cancel, autoCancelExpired };

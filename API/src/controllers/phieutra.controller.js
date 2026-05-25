const borrowService = require('../services/borrow.service');
const phieutraModel = require('../models/phieutra.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/** GET /api/phieutra?page=&limit=&madocgia= */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, madocgia } = req.query;
    const { data, count } = await phieutraModel.findAll({
      page: +page, limit: +limit,
      maDocGia: madocgia ? +madocgia : undefined,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/** GET /api/phieutra/:id */
const getById = async (req, res, next) => {
  try {
    const data = await phieutraModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/phieutra
 * Body: { madocgia, masachlist: [id, id, ...] }
 */
const create = async (req, res, next) => {
  try {
    const { madocgia, masachlist } = req.body;
    if (!madocgia) return sendError(res, 'madocgia là bắt buộc', 400);

    const result = await borrowService.createPhieuTra(+madocgia, masachlist);

    // Build message, including reservation notifications
    let msg = result.tong_tien_phat > 0
      ? `Trả sách thành công. Tiền phạt kỳ này: ${result.tong_tien_phat.toLocaleString('vi-VN')} đ`
      : 'Trả sách thành công. Không có phạt.';

    if (result.notified_reservations?.length > 0) {
      const names = result.notified_reservations.map((r) => r.hoten || `#${r.madocgia}`).join(', ');
      msg += ` | Thông báo đặt trước gửi đến: ${names}`;
    }

    return sendSuccess(res, result, msg, 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getById, create };

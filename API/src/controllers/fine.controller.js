const fineService    = require('../services/fine.service');
const borrowService  = require('../services/borrow.service');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/**
 * GET /api/fines/my-debt
 * For a logged-in reader: find their DOCGIA by email = tendangnhap, return debt.
 */
const getMyDebt = async (req, res, next) => {
  try {
    const supabase = require('../config/supabase');
    // Look up DOCGIA where email = tendangnhap of logged-in user
    const { data: docgia, error } = await supabase
      .from('docgia').select('madocgia').eq('email', req.user.tenDangNhap).single();
    if (error || !docgia) {
      return sendError(res, 'Không tìm thấy thẻ độc giả liên kết với tài khoản này', 404);
    }
    const result = await fineService.getReaderDebt(docgia.madocgia);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

/**
 * GET /api/fines/reader/:madocgia
 * Staff/Admin: get debt of a specific reader.
 */
const getReaderDebt = async (req, res, next) => {
  try {
    const result = await fineService.getReaderDebt(+req.params.madocgia);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
};

/**
 * POST /api/fines/collect
 * Body: { madocgia, sotienthu }
 * Delegates to borrow.service.createPhieuThu which handles DOCGIA.TienNo.
 */
const collectFine = async (req, res, next) => {
  try {
    const { madocgia, sotienthu } = req.body;
    if (!madocgia || !sotienthu) return sendError(res, 'madocgia và sotienthu là bắt buộc', 400);
    const receipt = await borrowService.createPhieuThu(+madocgia, +sotienthu);
    return sendSuccess(res, receipt, 'Thu tiền phạt thành công', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * GET /api/fines/receipts?page=&limit=&madocgia=
 */
const getReceipts = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, madocgia } = req.query;
    const { data, count } = await fineService.getFineReceipts({ page, limit, madocgia });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = { getMyDebt, getReaderDebt, collectFine, getReceipts };

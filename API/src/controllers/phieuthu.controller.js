const borrowService = require('../services/borrow.service');
const docgiaModel   = require('../models/docgia.model');
const phieuthuModel = require('../models/phieuthutienphat.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/**
 * GET /api/phieuthu?page=&limit=&madocgia=
 * List fine payment receipts.
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, madocgia } = req.query;
    const { data, count } = await phieuthuModel.findAll({
      page: +page, limit: +limit,
      maDocGia: madocgia ? +madocgia : undefined,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/**
 * GET /api/phieuthu/debt/:madocgia
 * Return reader's current debt info.
 */
const getDebt = async (req, res, next) => {
  try {
    const docgia = await docgiaModel.findById(+req.params.madocgia);
    return sendSuccess(res, {
      madocgia: docgia.madocgia,
      hoten:    docgia.hoten,
      email:    docgia.email,
      tienno:   Number(docgia.tienno),
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/phieuthu
 * Body: { madocgia, sotienthu }
 * Validates: sotienthu > 0, sotienthu <= TienNo.
 * Inserts PHIEUTHUTIENPHAT, subtracts from DOCGIA.TienNo.
 */
const create = async (req, res, next) => {
  try {
    const { madocgia, sotienthu } = req.body;
    if (!madocgia) return sendError(res, 'madocgia là bắt buộc', 400);
    if (!sotienthu || +sotienthu <= 0) return sendError(res, 'sotienthu phải lớn hơn 0', 400);

    const receipt = await borrowService.createPhieuThu(+madocgia, +sotienthu);
    return sendSuccess(res, receipt, 'Thu tiền phạt thành công', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getDebt, create };

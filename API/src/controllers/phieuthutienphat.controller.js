const borrowService   = require('../services/borrow.service');
const phieuthuModel   = require('../models/phieuthutienphat.model');
const docgiaModel     = require('../models/docgia.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/** GET /api/phieuthutienphat?page=&limit=&madocgia= */
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
 * GET /api/phieuthutienphat/debt/:madocgia
 * Returns reader info + current TienNo — used by the collection form.
 */
const getDebt = async (req, res, next) => {
  try {
    const docgia = await docgiaModel.findById(+req.params.madocgia);
    return sendSuccess(res, {
      madocgia:  docgia.madocgia,
      hoten:     docgia.hoten,
      email:     docgia.email,
      tienno:    Number(docgia.tienno),
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/phieuthutienphat
 * Body: { madocgia, sotienthu }
 */
const create = async (req, res, next) => {
  try {
    const { madocgia, sotienthu } = req.body;
    if (!madocgia) return sendError(res, 'madocgia là bắt buộc', 400);

    const result = await borrowService.createPhieuThu(+madocgia, sotienthu);
    return sendSuccess(
      res,
      result,
      `Thu ${Number(sotienthu).toLocaleString('vi-VN')} đ thành công. Còn nợ: ${result.tienno_sau.toLocaleString('vi-VN')} đ`,
      201
    );
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { getAll, getDebt, create };

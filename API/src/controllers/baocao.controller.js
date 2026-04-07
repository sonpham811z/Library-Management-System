const reportService       = require('../services/report.service');
const bcMuonSachModel     = require('../models/bctinhhinhmuonsach.model');
const bcSachTraTreModel   = require('../models/bcsachtratre.model');
const { sendSuccess, sendError } = require('../utils/response');

// ─── BCTINHHINHMUONSACH ───────────────────────────────────────────────────────

/** GET /api/baocao/muonsach?nam=&thang= */
const getAllMuonSach = async (req, res, next) => {
  try {
    const { nam, thang } = req.query;
    const data = await bcMuonSachModel.findAll({
      nam:   nam   ? +nam   : undefined,
      thang: thang ? +thang : undefined,
    });
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/baocao/muonsach/:id */
const getMuonSachById = async (req, res, next) => {
  try {
    const data = await bcMuonSachModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/baocao/muonsach
 * Body: { thang, nam }
 * Generates (or regenerates) the monthly borrow-by-category report.
 */
const generateMuonSach = async (req, res, next) => {
  try {
    const { thang, nam } = req.body;
    if (!thang || !nam) return sendError(res, 'thang và nam là bắt buộc', 400);
    if (thang < 1 || thang > 12) return sendError(res, 'thang phải từ 1 đến 12', 400);

    const result = await reportService.generateMuonSach(+thang, +nam);
    return sendSuccess(
      res,
      result,
      `Báo cáo tháng ${thang}/${nam}: tổng ${result.tongsoluotmuon} lượt mượn`,
      201
    );
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

// ─── BCSACHTRATRE ─────────────────────────────────────────────────────────────

/** GET /api/baocao/sachtratre */
const getAllSachTraTre = async (req, res, next) => {
  try {
    const data = await bcSachTraTreModel.findAll();
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/baocao/sachtratre/:id */
const getSachTraTreById = async (req, res, next) => {
  try {
    const data = await bcSachTraTreModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/baocao/sachtratre
 * No body required. Snapshots all currently-overdue books as of today.
 */
const generateSachTraTre = async (req, res, next) => {
  try {
    const result = await reportService.generateSachTraTre();
    const count  = (result.ct_bcsachtratre || []).length;
    return sendSuccess(
      res,
      result,
      `Báo cáo sách trả trễ ngày ${result.ngay}: ${count} cuốn`,
      201
    );
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = {
  getAllMuonSach, getMuonSachById, generateMuonSach,
  getAllSachTraTre, getSachTraTreById, generateSachTraTre,
};

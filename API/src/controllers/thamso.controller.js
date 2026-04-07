const thamsoModel = require('../models/thamso.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/thamso
 * Returns all parameters as an array: [{ tenthamso, giatri }]
 */
const getAll = async (req, res, next) => {
  try {
    const data = await thamsoModel.getAll();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/thamso
 * Body: { params: [{ tenthamso: string, giatri: number }] }
 * Updates one or more parameters.
 */
const updateMany = async (req, res, next) => {
  try {
    const { params } = req.body;

    if (!Array.isArray(params) || params.length === 0) {
      return sendError(res, 'params array là bắt buộc', 400);
    }

    for (const item of params) {
      if (!item.tenthamso || item.giatri === undefined || item.giatri === null) {
        return sendError(res, 'Mỗi phần tử cần có tenthamso và giatri', 400);
      }
      if (Number(item.giatri) < 0) {
        return sendError(res, `Giá trị của ${item.tenthamso} không được âm`, 400);
      }
    }

    const updated = await thamsoModel.updateMany(params);
    return sendSuccess(res, updated, 'Cập nhật tham số thành công');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, updateMany };

const tacgiaModel = require('../models/tacgia.model');
const { sendSuccess, sendError } = require('../utils/response');

/** GET /api/tacgia?search=... */
const getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const data = await tacgiaModel.findAll({ search });
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/tacgia/:id */
const getById = async (req, res, next) => {
  try {
    const data = await tacgiaModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** POST /api/tacgia — Body: { tentacgia } */
const create = async (req, res, next) => {
  try {
    const { tentacgia } = req.body;
    if (!tentacgia?.trim()) return sendError(res, 'tentacgia là bắt buộc', 400);
    const data = await tacgiaModel.create({ tentacgia: tentacgia.trim() });
    return sendSuccess(res, data, 'Thêm tác giả thành công', 201);
  } catch (err) { next(err); }
};

/** PUT /api/tacgia/:id — Body: { tentacgia } */
const update = async (req, res, next) => {
  try {
    const { tentacgia } = req.body;
    if (!tentacgia?.trim()) return sendError(res, 'tentacgia là bắt buộc', 400);
    const data = await tacgiaModel.update(+req.params.id, { tentacgia: tentacgia.trim() });
    return sendSuccess(res, data, 'Cập nhật tác giả thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/tacgia/:id */
const remove = async (req, res, next) => {
  try {
    await tacgiaModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa tác giả thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };

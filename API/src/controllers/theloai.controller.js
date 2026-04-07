const theloaiModel = require('../models/theloai.model');
const { sendSuccess, sendError } = require('../utils/response');

/** GET /api/theloai */
const getAll = async (req, res, next) => {
  try {
    const data = await theloaiModel.findAll();
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/theloai/:id */
const getById = async (req, res, next) => {
  try {
    const data = await theloaiModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** POST /api/theloai — Body: { tentheloai } */
const create = async (req, res, next) => {
  try {
    const { tentheloai } = req.body;
    if (!tentheloai?.trim()) return sendError(res, 'tentheloai là bắt buộc', 400);
    const data = await theloaiModel.create({ tentheloai: tentheloai.trim() });
    return sendSuccess(res, data, 'Thêm thể loại thành công', 201);
  } catch (err) { next(err); }
};

/** PUT /api/theloai/:id — Body: { tentheloai } */
const update = async (req, res, next) => {
  try {
    const { tentheloai } = req.body;
    if (!tentheloai?.trim()) return sendError(res, 'tentheloai là bắt buộc', 400);
    const data = await theloaiModel.update(+req.params.id, { tentheloai: tentheloai.trim() });
    return sendSuccess(res, data, 'Cập nhật thể loại thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/theloai/:id */
const remove = async (req, res, next) => {
  try {
    await theloaiModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa thể loại thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };

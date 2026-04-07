const loaidocgiaModel = require('../models/loaidocgia.model');
const { sendSuccess, sendError } = require('../utils/response');

/** GET /api/loaidocgia */
const getAll = async (req, res, next) => {
  try {
    const data = await loaidocgiaModel.findAll();
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** POST /api/loaidocgia — Body: { tenloaidocgia } */
const create = async (req, res, next) => {
  try {
    const { tenloaidocgia } = req.body;
    if (!tenloaidocgia) return sendError(res, 'tenloaidocgia là bắt buộc', 400);
    const data = await loaidocgiaModel.create({ tenloaidocgia: tenloaidocgia.trim() });
    return sendSuccess(res, data, 'Tạo loại độc giả thành công', 201);
  } catch (err) { next(err); }
};

/** PUT /api/loaidocgia/:id — Body: { tenloaidocgia } */
const update = async (req, res, next) => {
  try {
    const { tenloaidocgia } = req.body;
    if (!tenloaidocgia) return sendError(res, 'tenloaidocgia là bắt buộc', 400);
    const data = await loaidocgiaModel.update(+req.params.id, { tenloaidocgia });
    return sendSuccess(res, data, 'Cập nhật loại độc giả thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/loaidocgia/:id */
const remove = async (req, res, next) => {
  try {
    await loaidocgiaModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa loại độc giả thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };

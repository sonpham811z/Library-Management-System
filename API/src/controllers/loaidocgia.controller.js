const loaidocgiaModel = require("../models/loaidocgia.model");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const result = await loaidocgiaModel.findAll({
      search,
      page: +page,
      limit: +limit,
    });

    return sendPaginated(res, result.data, result.count, +page, +limit);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { tenloaidocgia } = req.body;

    if (!tenloaidocgia?.trim()) {
      return sendError(res, "tenloaidocgia là bắt buộc", 400);
    }

    const data = await loaidocgiaModel.create({
      tenloaidocgia: tenloaidocgia.trim(),
    });

    return sendSuccess(res, data, "Tạo loại độc giả thành công", 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { tenloaidocgia } = req.body;

    if (!tenloaidocgia?.trim()) {
      return sendError(res, "tenloaidocgia là bắt buộc", 400);
    }

    const data = await loaidocgiaModel.update(+req.params.id, {
      tenloaidocgia: tenloaidocgia.trim(),
    });

    return sendSuccess(res, data, "Cập nhật loại độc giả thành công");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await loaidocgiaModel.remove(+req.params.id);
    return sendSuccess(res, null, "Xóa loại độc giả thành công");
  } catch (err) {
    return sendError(
      res,
      err.message || "Không thể xóa loại độc giả",
      err.status || 409,
    );
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};

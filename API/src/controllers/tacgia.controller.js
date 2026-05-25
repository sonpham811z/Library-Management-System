const tacgiaModel = require("../models/tacgia.model");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

/** GET /api/tacgia */
const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const result = await tacgiaModel.findAll({
      search,
      page: +page,
      limit: +limit,
    });

    return sendPaginated(res, result.data, result.count, +page, +limit);
  } catch (err) {
    console.log("TACGIA ERROR:", err);
    next(err);
  }
};

/** GET /api/tacgia/:id */
const getById = async (req, res, next) => {
  try {
    const data = await tacgiaModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

/** POST */
const create = async (req, res, next) => {
  try {
    const { tentacgia } = req.body;

    if (!tentacgia?.trim()) {
      return sendError(res, "tentacgia là bắt buộc", 400);
    }

    const data = await tacgiaModel.create({
      tentacgia: tentacgia.trim(),
    });

    return sendSuccess(res, data, "Thêm tác giả thành công", 201);
  } catch (err) {
    next(err);
  }
};

/** PUT */
const update = async (req, res, next) => {
  try {
    const { tentacgia } = req.body;

    if (!tentacgia?.trim()) {
      return sendError(res, "tentacgia là bắt buộc", 400);
    }

    const data = await tacgiaModel.update(+req.params.id, {
      tentacgia: tentacgia.trim(),
    });

    return sendSuccess(res, data, "Cập nhật tác giả thành công");
  } catch (err) {
    next(err);
  }
};

/** DELETE */
const remove = async (req, res, next) => {
  try {
    await tacgiaModel.remove(+req.params.id);
    return sendSuccess(res, null, "Xóa tác giả thành công");
  } catch (err) {
    return sendError(
      res,
      err.message || "Không thể xóa tác giả",
      err.status || 409,
    );
  }
};
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};

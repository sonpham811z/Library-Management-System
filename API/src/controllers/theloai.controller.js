const theloaiModel = require("../models/theloai.model");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

/** GET /api/theloai */
const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const result = await theloaiModel.findAll({
      search,
      page: +page,
      limit: +limit,
    });

    return sendPaginated(res, result.data, result.count, +page, +limit);
  } catch (err) {
    console.log("THELOAI ERROR:", err);
    next(err);
  }
};

/** GET /api/theloai/:id */
const getById = async (req, res, next) => {
  try {
    const data = await theloaiModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

/** CREATE */
const create = async (req, res, next) => {
  try {
    const { tentheloai } = req.body;

    if (!tentheloai?.trim()) {
      return sendError(res, "tentheloai là bắt buộc", 400);
    }

    const data = await theloaiModel.create({
      tentheloai: tentheloai.trim(),
    });

    return sendSuccess(res, data, "Thêm thể loại thành công", 201);
  } catch (err) {
    next(err);
  }
};

/** UPDATE */
const update = async (req, res, next) => {
  try {
    const { tentheloai } = req.body;

    if (!tentheloai?.trim()) {
      return sendError(res, "tentheloai là bắt buộc", 400);
    }

    const data = await theloaiModel.update(+req.params.id, {
      tentheloai: tentheloai.trim(),
    });

    return sendSuccess(res, data, "Cập nhật thể loại thành công");
  } catch (err) {
    next(err);
  }
};

/** DELETE - FIX QUAN TRỌNG */
const remove = async (req, res, next) => {
  try {
    await theloaiModel.remove(+req.params.id);
    return sendSuccess(res, null, "Xóa thể loại thành công");
  } catch (err) {
    return sendError(
      res,
      err.message || "Không thể xóa thể loại này",
      err.status || 500,
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

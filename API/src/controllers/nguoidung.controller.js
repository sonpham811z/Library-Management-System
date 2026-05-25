const bcrypt = require('bcryptjs');
const nguoidungModel = require('../models/nguoidung.model');
const nhomnguoidungModel = require('../models/nhomnguoidung.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/** GET /api/nguoidung */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { data, count } = await nguoidungModel.findAll({ page: +page, limit: +limit });
    console.log(data)
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/** GET /api/nguoidung/:id */
const getById = async (req, res, next) => {
  try {
    const user = await nguoidungModel.findById(+req.params.id);
    return sendSuccess(res, user);
  } catch (err) { next(err); }
};

/**
 * POST /api/nguoidung
 * Body: { tendangnhap, matkhau, manhom }
 */
const create = async (req, res, next) => {
  try {
    const { tendangnhap, matkhau, manhom } = req.body;
    if (!tendangnhap || !matkhau || !manhom) {
      return sendError(res, 'tendangnhap, matkhau và manhom là bắt buộc', 400);
    }
    if (matkhau.length < 6) {
      return sendError(res, 'Mật khẩu cần ít nhất 6 ký tự', 400);
    }

    // Validate group exists
    await nhomnguoidungModel.findById(+manhom);

    const hashedPassword = await bcrypt.hash(matkhau, 12);
    const newUser = await nguoidungModel.create({
      tendangnhap: tendangnhap.trim(),
      matkhau: hashedPassword,
      manhom: +manhom,
    });

    return sendSuccess(res, newUser, 'Tạo tài khoản thành công', 201);
  } catch (err) {
    if (err.code === '23505') return sendError(res, 'Tên đăng nhập đã tồn tại', 409);
    next(err);
  }
};

/**
 * PUT /api/nguoidung/:id
 * Body: { manhom } — only group reassignment allowed here; password change via /auth/change-password
 */
const update = async (req, res, next) => {
  try {
    const { manhom } = req.body;
    if (!manhom) return sendError(res, 'manhom là bắt buộc', 400);

    await nhomnguoidungModel.findById(+manhom);
    const updated = await nguoidungModel.update(+req.params.id, { manhom: +manhom });
    return sendSuccess(res, updated, 'Cập nhật tài khoản thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/nguoidung/:id */
const remove = async (req, res, next) => {
  try {
    await nguoidungModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa tài khoản thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };

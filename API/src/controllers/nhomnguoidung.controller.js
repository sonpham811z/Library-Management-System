const nhomnguoidungModel = require('../models/nhomnguoidung.model');
const phanquyenModel = require('../models/phanquyen.model');
const { sendSuccess, sendError } = require('../utils/response');

/** GET /api/nhomnguoidung */
const getAll = async (req, res, next) => {
  try {
    const data = await nhomnguoidungModel.findAll();
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/nhomnguoidung/:id */
const getById = async (req, res, next) => {
  try {
    const data = await nhomnguoidungModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/nhomnguoidung/:id/phanquyen */
const getPhanQuyen = async (req, res, next) => {
  try {
    const data = await phanquyenModel.findByNhom(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** POST /api/nhomnguoidung — Body: { tennhom } */
const create = async (req, res, next) => {
  try {
    const { tennhom } = req.body;
    if (!tennhom) return sendError(res, 'tennhom là bắt buộc', 400);
    const data = await nhomnguoidungModel.create({ tennhom: tennhom.trim() });
    return sendSuccess(res, data, 'Tạo nhóm thành công', 201);
  } catch (err) { next(err); }
};

/** PUT /api/nhomnguoidung/:id — Body: { tennhom } */
const update = async (req, res, next) => {
  try {
    const { tennhom } = req.body;
    if (!tennhom) return sendError(res, 'tennhom là bắt buộc', 400);
    const data = await nhomnguoidungModel.update(+req.params.id, { tennhom });
    return sendSuccess(res, data, 'Cập nhật nhóm thành công');
  } catch (err) { next(err); }
};

/**
 * PUT /api/nhomnguoidung/:id/phanquyen
 * Body: { machucnangList: [1, 2, 3] }
 * Replaces all permissions for a group.
 */
const setPhanQuyen = async (req, res, next) => {
  try {
    const { machucnangList } = req.body;
    if (!Array.isArray(machucnangList)) {
      return sendError(res, 'machucnangList phải là mảng số', 400);
    }
    const data = await phanquyenModel.setForNhom(+req.params.id, machucnangList);
    return sendSuccess(res, data, 'Cập nhật phân quyền thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/nhomnguoidung/:id */
const remove = async (req, res, next) => {
  try {
    await nhomnguoidungModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa nhóm thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getPhanQuyen, create, update, setPhanQuyen, remove };

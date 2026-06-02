const phieunhapModel = require("../models/phieunhap.model");
const ctPhieuNhapModel = require("../models/ct_phieunhap.model");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const { data, count } = await phieunhapModel.findAll({
      page: +page,
      limit: +limit,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await phieunhapModel.findById(Number(req.params.id));
    if (!data) return sendError(res, "Không tìm thấy phiếu nhập", 404);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

/** POST /api/phieunhap (Tạo phiếu nhập gốc) */
const create = async (req, res, next) => {
  try {
    const { ngaynhap, tongtien } = req.body;
    const result = await phieunhapModel.create({ ngaynhap, tongtien });
    return sendSuccess(res, result, "Khởi tạo phiếu nhập thành công", 201);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/phieunhap/:id/details (Frontend gọi sau khi tạo xong sách lẻ để lưu snapshot) */
const saveDetails = async (req, res, next) => {
  try {
    const maPhieuNhap = Number(req.params.id);
    const { details, tongtien } = req.body;

    if (!Array.isArray(details) || details.length === 0) {
      return sendError(res, "Danh sách chi tiết không được rỗng", 400);
    }

    // 1. Lưu các dòng chi tiết snapshot vào DB
    await ctPhieuNhapModel.addMany(maPhieuNhap, details);

    // 2. Cập nhật lại tổng tiền thực tế cuối cùng của phiếu nhập
    const result = await phieunhapModel.update(maPhieuNhap, { tongtien });

    return sendSuccess(res, result, "Lập phiếu nhập kho thành công", 200);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, saveDetails };

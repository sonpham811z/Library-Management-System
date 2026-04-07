const path = require('path');
const XLSX = require('xlsx');
const sachModel = require('../models/sach.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/**
 * GET /api/sach/search?q=...
 * Autocomplete search for AVAILABLE books.
 * Matches TenTuaSach (via tuasach join), NhaXB, or MaSach.
 */
const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return sendSuccess(res, []);
    const data = await sachModel.search(q.trim());
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/sach?matuasach=X&trangthai=&page=1&limit=20 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, matuasach, trangthai } = req.query;
    const { data, count } = await sachModel.findAll({
      page: +page,
      limit: +limit,
      maTuaSach: matuasach ? +matuasach : undefined,
      trangThai: trangthai || undefined,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/** GET /api/sach/:id */
const getById = async (req, res, next) => {
  try {
    const data = await sachModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/sach
 * Body: { matuasach, namxb, nhaxb?, ngaynhap, trigia }
 * TrangThai defaults to 'Có sẵn'.
 */
const create = async (req, res, next) => {
  try {
    const { matuasach, namxb, nhaxb, ngaynhap, trigia } = req.body;

    if (!matuasach) return sendError(res, 'matuasach là bắt buộc', 400);
    if (!namxb) return sendError(res, 'namxb (năm xuất bản) là bắt buộc', 400);
    if (!ngaynhap) return sendError(res, 'ngaynhap là bắt buộc', 400);
    if (trigia === undefined || trigia === null) return sendError(res, 'trigia là bắt buộc', 400);

    const currentYear = new Date().getFullYear();
    if (+namxb > currentYear) {
      return sendError(res, `Năm xuất bản không được lớn hơn năm hiện tại (${currentYear})`, 400);
    }
    if (+trigia < 0) return sendError(res, 'Trị giá không được âm', 400);

    const data = await sachModel.create({
      matuasach: +matuasach,
      namxb: +namxb,
      nhaxb: nhaxb || null,
      ngaynhap,
      trigia: +trigia,
      // TrangThai defaults to 'Có sẵn' in model
    });

    return sendSuccess(res, data, 'Thêm bản sao thành công', 201);
  } catch (err) { next(err); }
};

/**
 * PUT /api/sach/:id
 * Body: { namxb?, nhaxb?, ngaynhap?, trigia?, trangthai? }
 */
const update = async (req, res, next) => {
  try {
    const { namxb, nhaxb, ngaynhap, trigia, trangthai } = req.body;
    const payload = {};

    if (namxb !== undefined) payload.namxb = +namxb;
    if (nhaxb !== undefined) payload.nhaxb = nhaxb;
    if (ngaynhap !== undefined) payload.ngaynhap = ngaynhap;
    if (trigia !== undefined) payload.trigia = +trigia;
    if (trangthai !== undefined) {
      const VALID = ['Có sẵn', 'Đã mượn'];
      if (!VALID.includes(trangthai)) {
        return sendError(res, `trangthai phải là một trong: ${VALID.join(', ')}`, 400);
      }
      payload.trangthai = trangthai;
    }

    const data = await sachModel.update(+req.params.id, payload);
    return sendSuccess(res, data, 'Cập nhật bản sao thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/sach/:id — only allowed if TrangThai = 'Có sẵn' */
const remove = async (req, res, next) => {
  try {
    const sach = await sachModel.findById(+req.params.id);
    if (sach.trangthai !== 'Có sẵn') {
      return sendError(
        res,
        `Không thể xóa bản sao đang ở trạng thái "${sach.trangthai}"`,
        409
      );
    }
    await sachModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa bản sao thành công');
  } catch (err) { next(err); }
};

/**
 * POST /api/sach/bulk
 * Multipart upload of .xlsx / .xls / .csv file.
 * Expected columns (case-insensitive): matuasach, namxb, nhaxb, ngaynhap, trigia
 *
 * Returns:
 *   { insertedCount, inserted[], skippedCount, errors[] }
 */
const bulkInsert = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'Vui lòng đính kèm file Excel hoặc CSV', 400);

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows;

    if (ext === '.csv') {
      // Parse CSV via xlsx (supports CSV natively)
      const wb = XLSX.read(req.file.buffer, { type: 'buffer', raw: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    } else {
      // .xlsx / .xls
      const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    }

    if (!rows || rows.length === 0) return sendError(res, 'File không có dữ liệu', 400);

    // Normalize header keys to lowercase
    const normalised = rows.map((r) => {
      const obj = {};
      for (const key of Object.keys(r)) obj[key.trim().toLowerCase()] = r[key];
      return obj;
    });

    const { inserted, errors } = await sachModel.bulkCreate(normalised);

    return sendSuccess(
      res,
      { insertedCount: inserted.length, inserted, skippedCount: errors.length, errors },
      `Nhập thành công ${inserted.length} bản sao. Bỏ qua ${errors.length} dòng lỗi.`,
      201
    );
  } catch (err) { next(err); }
};

module.exports = { search, getAll, getById, create, bulkInsert, update, remove };

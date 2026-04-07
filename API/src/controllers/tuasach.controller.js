const tuasachModel = require('../models/tuasach.model');
const ctTacGiaModel = require('../models/ct_tacgia.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/** GET /api/tuasach?page=1&limit=15&search=&matheloai= */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search, matheloai } = req.query;
    const { data, count } = await tuasachModel.findAll({
      page: +page,
      limit: +limit,
      search,
      maTheLoai: matheloai ? +matheloai : undefined,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/** GET /api/tuasach/:id — full detail with authors + category */
const getById = async (req, res, next) => {
  try {
    const data = await tuasachModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/tuasach
 * Body: { tentuasach, matheloai, anhbia?, matacgialist: [1, 2] }
 *
 * Atomically:
 *   1. Insert into TUASACH
 *   2. Insert all rows in CT_TACGIA for the given author IDs
 */
const create = async (req, res, next) => {
  try {
    const { tentuasach, matheloai, anhbia, matacgialist } = req.body;

    if (!tentuasach?.trim()) return sendError(res, 'tentuasach là bắt buộc', 400);
    if (!matheloai) return sendError(res, 'matheloai là bắt buộc', 400);

    // 1. Create title record
    const tuasach = await tuasachModel.create({
      tentuasach: tentuasach.trim(),
      matheloai: +matheloai,
      anhbia: anhbia || null,
    });

    // 2. Link authors (CT_TACGIA many-to-many)
    const authorIds = Array.isArray(matacgialist) ? matacgialist.map(Number).filter(Boolean) : [];
    if (authorIds.length > 0) {
      await ctTacGiaModel.setForTuaSach(tuasach.matuasach, authorIds);
    }

    // 3. Return full record including joined authors
    const full = await tuasachModel.findById(tuasach.matuasach);
    return sendSuccess(res, full, 'Thêm tựa sách thành công', 201);
  } catch (err) { next(err); }
};

/**
 * PUT /api/tuasach/:id
 * Body: { tentuasach?, matheloai?, anhbia?, matacgialist? }
 *
 * If matacgialist is provided, replaces all authors in CT_TACGIA atomically.
 */
const update = async (req, res, next) => {
  try {
    const { tentuasach, matheloai, anhbia, matacgialist } = req.body;
    const maTuaSach = +req.params.id;

    const payload = {};
    if (tentuasach !== undefined) payload.tentuasach = tentuasach.trim();
    if (matheloai !== undefined) payload.matheloai = +matheloai;
    if (anhbia !== undefined) payload.anhbia = anhbia;

    if (Object.keys(payload).length > 0) {
      await tuasachModel.update(maTuaSach, payload);
    }

    // Replace authors if provided
    if (Array.isArray(matacgialist)) {
      const authorIds = matacgialist.map(Number).filter(Boolean);
      await ctTacGiaModel.setForTuaSach(maTuaSach, authorIds);
    }

    const full = await tuasachModel.findById(maTuaSach);
    return sendSuccess(res, full, 'Cập nhật tựa sách thành công');
  } catch (err) { next(err); }
};

/** DELETE /api/tuasach/:id — cascades to CT_TACGIA and SACH via DB ON DELETE CASCADE */
const remove = async (req, res, next) => {
  try {
    await tuasachModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa tựa sách thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };

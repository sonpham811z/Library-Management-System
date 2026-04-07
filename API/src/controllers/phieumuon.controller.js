const borrowService  = require('../services/borrow.service');
const phieumuonModel = require('../models/phieumuon.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/** GET /api/phieumuon?page=&limit=&madocgia= */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, madocgia } = req.query;
    const { data, count } = await phieumuonModel.findAll({
      page: +page, limit: +limit,
      maDocGia: madocgia ? +madocgia : undefined,
    });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/** GET /api/phieumuon/:id */
const getById = async (req, res, next) => {
  try {
    const data = await phieumuonModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * GET /api/phieumuon/active/:madocgia
 * Returns all books currently borrowed (not yet returned) by a reader,
 * including estimated days late and fine per book.
 * Used by the Return form to pre-populate the book list.
 */
const getActive = async (req, res, next) => {
  try {
    const data = await borrowService.getActiveBorrows(+req.params.madocgia);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/phieumuon
 * Body: { madocgia, masachlist: [id, id, ...] }
 */
const create = async (req, res, next) => {
  try {
    const { madocgia, masachlist } = req.body;
    if (!madocgia) return sendError(res, 'madocgia là bắt buộc', 400);

    const result = await borrowService.createPhieuMuon(+madocgia, masachlist);
    return sendSuccess(res, result, 'Lập phiếu mượn thành công', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * GET /api/phieumuon/my
 * Returns all phieumuon for the logged-in reader.
 * Prefer manguoidung FK; fall back to legacy email match.
 */
const getMy = async (req, res, next) => {
  try {
    const supabase = require('../config/supabase');
    let docgia = null;

    if (req.user.maNguoiDung) {
      const { data, error } = await supabase
        .from('docgia')
        .select('madocgia')
        .eq('manguoidung', req.user.maNguoiDung)
        .single();
      if (!error && data) docgia = data;
    }

    if (!docgia) {
      const { data, error } = await supabase
        .from('docgia')
        .select('madocgia')
        .eq('email', req.user.tenDangNhap)
        .single();
      if (!error && data) docgia = data;
    }

    if (!docgia) {
      return sendSuccess(res, { data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
    }

    const { page = 1, limit = 10 } = req.query;
    const { data: borrowRows, count } = await phieumuonModel.findAll({
      page: +page, limit: +limit, maDocGia: docgia.madocgia,
    });

    const { data: returnRows, error: returnError } = await supabase
      .from('phieutra')
      .select('maphieutra, ngaytra, ct_phieutra(maphieumuon, masach)')
      .eq('madocgia', docgia.madocgia);
    if (returnError) throw returnError;

    const returnedPairs = new Set();
    for (const slip of returnRows || []) {
      for (const detail of slip.ct_phieutra || []) {
        if (detail.maphieumuon && detail.masach) {
          returnedPairs.add(`${detail.maphieumuon}:${detail.masach}`);
        }
      }
    }

    const rows = (borrowRows || []).map((row) => {
      const books = Array.isArray(row.ct_phieumuon) ? row.ct_phieumuon : [];
      const allReturned = books.length > 0 && books.every((detail) => returnedPairs.has(`${row.maphieumuon}:${detail.masach}`));

      return {
        ...row,
        trangthai: allReturned
          ? 'Đã trả'
          : (new Date(row.hantra) < new Date() ? 'Quá hạn' : 'Đang mượn'),
      };
    });

    return sendPaginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getActive, create, getMy };

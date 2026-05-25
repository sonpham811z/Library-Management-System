const docgiaModel = require('../models/docgia.model');
const thamsoModel = require('../models/thamso.model');
const { THAMSO } = require('../config/constants');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const e = require('express');

// ─── Helper: calculate age from a date string ────────────────────────────────
const tinhTuoi = (ngaySinhStr) => {
  const ngaySinh = new Date(ngaySinhStr);
  const hom_nay = new Date();
  let tuoi = hom_nay.getFullYear() - ngaySinh.getFullYear();
  const thangDiff = hom_nay.getMonth() - ngaySinh.getMonth();
  if (thangDiff < 0 || (thangDiff === 0 && hom_nay.getDate() < ngaySinh.getDate())) {
    tuoi--;
  }
  return tuoi;
};

// ─── Helper: add N months to a date ─────────────────────────────────────────
const themThang = (date, soThang) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + soThang);
  return result.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * GET /api/docgia/search?q=...
 * Autocomplete: search readers by HoTen, Email, or MaDocGia.
 * Returns up to 10 results for dropdown display.
 */
const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return sendSuccess(res, []);
    const data = await docgiaModel.search(q.trim());
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/** GET /api/docgia */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const { data, count } = await docgiaModel.findAll({ page: +page, limit: +limit, search });
    return sendPaginated(res, data, count, page, limit);
  } catch (err) { next(err); }
};

/** GET /api/docgia/:id */
const getById = async (req, res, next) => {
  try {
    const data = await docgiaModel.findById(+req.params.id);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * POST /api/docgia
 * ─── BUSINESS LOGIC ───────────────────────────────────────────────────────────
 * 1. Fetch TuoiToiThieu, TuoiToiDa, ThoiHanTheThang from THAMSO.
 * 2. Validate reader's age is within [TuoiToiThieu, TuoiToiDa].
 * 3. Auto-set NgayLapThe = today, NgayHetHan = today + ThoiHanTheThang months.
 * 4. TienNo defaults to 0.
 */
const create = async (req, res, next) => {
  try {
    const { hoten, ngaysinh, diachi, email, maloaidocgia, manguoidung } = req.body;
    if (!hoten || !ngaysinh || !maloaidocgia) {
      return sendError(res, 'hoten, ngaysinh và maloaidocgia là bắt buộc', 400);
    }

    // ── Step 1: Fetch all required THAMSO params ──────────────────────────────
    const thamso = await thamsoModel.getAsMap();
    const tuoiToiThieu = thamso[THAMSO.TUOI_TOI_THIEU];
    const tuoiToiDa    = thamso[THAMSO.TUOI_TOI_DA];
    const thoiHanThang = thamso[THAMSO.THOI_HAN_THE_THANG];

    if (tuoiToiThieu === undefined || tuoiToiDa === undefined || thoiHanThang === undefined) {
      return sendError(res, 'Chưa cấu hình đủ tham số THAMSO (TuoiToiThieu, TuoiToiDa, ThoiHanTheThang)', 500);
    }

    // ── Step 2: Validate age ──────────────────────────────────────────────────
    const tuoi = tinhTuoi(ngaysinh);
    if (tuoi < tuoiToiThieu) {
      return sendError(
        res,
        `Độc giả phải đủ ${tuoiToiThieu} tuổi. Tuổi hiện tại: ${tuoi}`,
        400
      );
    }
    if (tuoi > tuoiToiDa) {
      return sendError(
        res,
        `Độc giả không được quá ${tuoiToiDa} tuổi. Tuổi hiện tại: ${tuoi}`,
        400
      );
    }

    // ── Step 3: Auto-calculate card dates ─────────────────────────────────────
    const ngayLapThe = new Date().toISOString().split('T')[0]; // today YYYY-MM-DD
    const ngayHetHan = themThang(ngayLapThe, thoiHanThang);

    const newDocGia = await docgiaModel.create({
      hoten: hoten.trim(),
      ngaysinh,
      diachi: diachi || null,
      email: email || null,
      ngaylapthe: ngayLapThe,
      ngayhethan: ngayHetHan,
      tienno: 0,
      maloaidocgia: +maloaidocgia,
      manguoidung: manguoidung ? +manguoidung : null,
    });

    return sendSuccess(res, newDocGia, `Lập thẻ thành công. Hạn thẻ: ${ngayHetHan}`, 201);
  } catch (err) {
    if (err.code === '23505') return sendError(res, 'Email đã tồn tại trong hệ thống', 409);
    next(err);
  }
};

/**
 * PUT /api/docgia/:id
 * Can update hoten, diachi, email, maloaidocgia.
 * NgaySinh changes also re-validate age.
 */
const update = async (req, res, next) => {
  try {
    const { hoten, ngaysinh, diachi, email, maloaidocgia } = req.body;
    const payload = {};

    if (ngaysinh) {
      // Re-validate age when date of birth is being changed
      const thamso = await thamsoModel.getAsMap();
      const tuoi = tinhTuoi(ngaysinh);
      if (tuoi < thamso[THAMSO.TUOI_TOI_THIEU]) {
        return sendError(res, `Độc giả phải đủ ${thamso[THAMSO.TUOI_TOI_THIEU]} tuổi`, 400);
      }
      if (tuoi > thamso[THAMSO.TUOI_TOI_DA]) {
        return sendError(res, `Độc giả không được quá ${thamso[THAMSO.TUOI_TOI_DA]} tuổi`, 400);
      }
      payload.ngaysinh = ngaysinh;
    }

    if (hoten !== undefined) payload.hoten = hoten.trim();
    if (diachi !== undefined) payload.diachi = diachi;
    if (email !== undefined) payload.email = email;
    if (maloaidocgia !== undefined) payload.maloaidocgia = +maloaidocgia;

    const updated = await docgiaModel.update(+req.params.id, payload);
    return sendSuccess(res, updated, 'Cập nhật độc giả thành công');
  } catch (err) {
    if (err.code === '23505') return sendError(res, 'Email đã tồn tại trong hệ thống', 409);
    next(err);
  }
};

/**
 * PUT /api/docgia/:id/giahan
 * Renew card: NgayHetHan += ThoiHanTheThang months from today.
 */
const giaHan = async (req, res, next) => {
  try {
    const thamso = await thamsoModel.getAsMap();
    const thoiHanThang = thamso[THAMSO.THOI_HAN_THE_THANG];

    const ngayHetHanMoi = themThang(new Date().toISOString().split('T')[0], thoiHanThang);
    const updated = await docgiaModel.update(+req.params.id, { ngayhethan: ngayHetHanMoi });
    return sendSuccess(res, updated, `Gia hạn thành công. Hạn mới: ${ngayHetHanMoi}`);
  } catch (err) { next(err); }
};

/** DELETE /api/docgia/:id */
const remove = async (req, res, next) => {
  try {
    await docgiaModel.remove(+req.params.id);
    return sendSuccess(res, null, 'Xóa độc giả thành công');
  } catch (err) { 
    if(err.code === '23503') {
      return sendError(res, 'Không thể xóa độc giả đang có sách mượn hoặc nợ tiền', 409);
    }
    next(err); 
  }
};

/**
 * GET /api/docgia/me
 * Finds the DOCGIA record linked to the logged-in user via manguoidung FK.
 * Falls back to email match for legacy accounts without the FK set.
 */
const getMe = async (req, res, next) => {
  try {
    let data = await docgiaModel.findByNguoiDung(req.user.maNguoiDung);
    if (!data) {
      // Legacy fallback: match by email = tendangnhap
      data = await docgiaModel.findByEmail(req.user.tenDangNhap);
    }
    if (!data) {
      return sendError(res, 'Không tìm thấy thẻ độc giả liên kết với tài khoản này', 404);
    }
    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/docgia/avatar
 * Upload avatar image to Cloudinary and save the URL in DOCGIA.AnhDaiDien.
 * req.file is provided by multer-storage-cloudinary (uploadAvatar middleware).
 */
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'Vui lòng chọn ảnh để tải lên', 400);

    // Find the reader's docgia record
    let docgia = await docgiaModel.findByNguoiDung(req.user.maNguoiDung);
    if (!docgia) docgia = await docgiaModel.findByEmail(req.user.tenDangNhap);
    if (!docgia) return sendError(res, 'Không tìm thấy thẻ độc giả liên kết với tài khoản này', 404);

    const imageUrl = req.file.path; // Cloudinary returns secure_url as path
    const updated  = await docgiaModel.update(docgia.madocgia, { anhdaidien: imageUrl });

    return sendSuccess(res, { anhdaidien: imageUrl, docgia: updated }, 'Cập nhật ảnh đại diện thành công');
  } catch (err) { next(err); }
};

module.exports = { search, getAll, getById, create, update, giaHan, remove, getMe, updateAvatar };

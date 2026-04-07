const bcrypt = require('bcryptjs');
const nguoidungModel = require('../models/nguoidung.model');
const nhomnguoidungModel = require('../models/nhomnguoidung.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

/**
 * Login with TenDangNhap + MatKhau.
 * JWT payload includes `role` = TenNhom so the authorize middleware
 * can do simple string checks (e.g. authorize('ADMIN')).
 */
const login = async (tendangnhap, matkhau) => {
  
  const user = await nguoidungModel.findByTenDangNhap(tendangnhap);
  console.log(user)
  if (!user) throw { statusCode: 401, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  console.log(user)
  const isMatch = await bcrypt.compare(matkhau, user.matkhau);

  if (!isMatch) throw { statusCode: 401, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };

  // Resolve group name → used as `role` in JWT for backward-compatible authorize checks
  let role = 'STAFF';
  try {
    const nhom = await nhomnguoidungModel.findById(user.manhom);
    if (nhom) role = nhom.tennhom.toUpperCase();
  } catch { /* default STAFF if group not found */ }

  const payload = {
    maNguoiDung: user.manguoidung,
    tenDangNhap: user.tendangnhap,
    maNhom: user.manhom,
    role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ maNguoiDung: user.manguoidung });

  return {
    accessToken,
    refreshToken,
    user: {
      maNguoiDung: user.manguoidung,
      tenDangNhap: user.tendangnhap,
      maNhom: user.manhom,
      role,
    },
  };
};

/**
 * Stateless refresh — just re-sign from the verified refresh payload.
 * No DB storage needed (NGUOIDUNG has no refresh_token column).
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await nguoidungModel.findById(decoded.maNguoiDung);
    if (!user) throw new Error('User not found');

    let role = 'STAFF';
    try {
      const nhom = await nhomnguoidungModel.findById(user.manhom);
      if (nhom) role = nhom.tennhom.toUpperCase();
    } catch { /* default */ }

    const payload = {
      maNguoiDung: user.manguoidung,
      tenDangNhap: user.tendangnhap,
      maNhom: user.manhom,
      role,
    };

    return { accessToken: generateAccessToken(payload) };
  } catch {
    throw { statusCode: 401, message: 'Token không hợp lệ hoặc đã hết hạn' };
  }
};

/** Logout is stateless — client just discards tokens */
const logout = async () => {};

const changePassword = async (maNguoiDung, currentPassword, newPassword) => {
  const user = await nguoidungModel.findByIdFull(maNguoiDung);
  if (!user) throw { statusCode: 404, message: 'Người dùng không tồn tại' };

  const isMatch = await bcrypt.compare(currentPassword, user.matkhau);
  if (!isMatch) throw { statusCode: 400, message: 'Mật khẩu hiện tại không đúng' };

  const hashedNew = await bcrypt.hash(newPassword, 12);
  await nguoidungModel.update(maNguoiDung, { matkhau: hashedNew });
};

module.exports = { login, refreshAccessToken, logout, changePassword };

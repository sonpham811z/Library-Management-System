const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { tendangnhap, matkhau } = req.body;
    console.log(tendangnhap, matkhau)
    if (!tendangnhap || !matkhau) {
      return sendError(res, 'Tên đăng nhập và mật khẩu là bắt buộc', 400);
    }
    const result = await authService.login(tendangnhap, matkhau);
    console.log(result)
    return sendSuccess(res, result, 'Đăng nhập thành công');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token là bắt buộc', 400);
    const result = await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res, result, 'Token đã được làm mới');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout();
    return sendSuccess(res, null, 'Đăng xuất thành công');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Cần cung cấp cả mật khẩu cũ và mới', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'Mật khẩu mới cần ít nhất 6 ký tự', 400);
    }
    await authService.changePassword(req.user.maNguoiDung, currentPassword, newPassword);
    return sendSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, req.user, 'Thông tin người dùng hiện tại');
};

module.exports = { login, refresh, logout, changePassword, getMe };

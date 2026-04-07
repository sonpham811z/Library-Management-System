const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

/**
 * Verifies JWT and attaches decoded payload to req.user.
 * Payload shape: { maNguoiDung, tenDangNhap, maNhom, role }
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Chưa cung cấp token', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token đã hết hạn', 401);
    }
    return sendError(res, 'Token không hợp lệ', 401);
  }
};

/**
 * Role-based authorization.
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'STAFF')
 * Matches against req.user.role which equals TenNhom from NHOMNGUOIDUNG (uppercase).
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Chưa xác thực', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Không có quyền thực hiện thao tác này', 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };

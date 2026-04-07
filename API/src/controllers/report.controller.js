const reportService = require('../services/report.service');
const { sendSuccess, sendError } = require('../utils/response');

const getBorrowByCategory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return sendError(res, 'from and to dates are required', 400);
    const result = await reportService.getBorrowByCategory(from, to);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getOverdueReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return sendError(res, 'from and to dates are required', 400);
    const result = await reportService.getOverdueReport(from, to);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const result = await reportService.getDashboardStats();
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getBorrowByCategory, getOverdueReport, getDashboardStats };

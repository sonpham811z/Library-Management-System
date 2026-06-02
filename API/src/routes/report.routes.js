const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.STAFF));

router.get('/dashboard', reportController.getDashboardStats);
router.get('/borrow-by-category', reportController.getBorrowByCategory);
router.get('/overdue', reportController.getOverdueReport);
router.get('/revenue', reportController.getRevenue);
router.get('/borrow-trend', reportController.getBorrowTrend);

module.exports = router;

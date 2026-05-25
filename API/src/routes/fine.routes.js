const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// READER: get own debt (looks up docgia by email = tendangnhap)
router.get('/my-debt', fineController.getMyDebt);

// STAFF/ADMIN: get reader debt by madocgia
router.get('/reader/:madocgia', authorize('ADMIN', 'STAFF'), fineController.getReaderDebt);

// STAFF/ADMIN: collect fine payment
router.post('/collect', authorize('ADMIN', 'STAFF'), fineController.collectFine);

// STAFF/ADMIN: get all receipts
router.get('/receipts', authorize('ADMIN', 'STAFF'), fineController.getReceipts);

module.exports = router;

const express = require('express');
const router = express.Router();
const c = require('../controllers/nhomnguoidung.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.get('/:id/phanquyen', c.getPhanQuyen);
router.post('/', authorize('ADMIN'), c.create);
router.put('/:id', authorize('ADMIN'), c.update);
router.put('/:id/phanquyen', authorize('ADMIN'), c.setPhanQuyen);
router.delete('/:id', authorize('ADMIN'), c.remove);

module.exports = router;

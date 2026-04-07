const express = require('express');
const router  = express.Router();
const c       = require('../controllers/phieuthutienphat.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// specific before :id
router.get('/debt/:madocgia', c.getDebt);
router.get('/', c.getAll);
router.post('/', authorize('ADMIN', 'STAFF'), c.create);

module.exports = router;

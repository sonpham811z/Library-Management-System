const express = require('express');
const router  = express.Router();
const c       = require('../controllers/baocao.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// BCTINHHINHMUONSACH — monthly borrow-by-category report
router.get('/muonsach',      c.getAllMuonSach);
router.get('/muonsach/:id',  c.getMuonSachById);
router.post('/muonsach',     authorize('ADMIN', 'STAFF'), c.generateMuonSach);

// BCSACHTRATRE — overdue books snapshot
router.get('/sachtratre',      c.getAllSachTraTre);
router.get('/sachtratre/:id',  c.getSachTraTreById);
router.post('/sachtratre',     authorize('ADMIN', 'STAFF'), c.generateSachTraTre);

module.exports = router;

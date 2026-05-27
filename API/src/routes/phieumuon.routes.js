const express = require('express');
const router  = express.Router();
const c       = require('../controllers/phieumuon.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// IMPORTANT: specific routes before :id
router.get('/my',                c.getMy);
router.get('/active/:madocgia',  c.getActive);
router.get('/',                  c.getAll);
router.get('/:id',               c.getById);
router.post('/',   authorize('ADMIN', 'STAFF'), c.create);
router.put('/:id', authorize('ADMIN', 'STAFF'), c.update);
router.delete('/:id', authorize('ADMIN', 'STAFF'), c.remove);

module.exports = router;

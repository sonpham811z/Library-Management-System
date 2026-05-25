const express = require('express');
const router = express.Router();
const c = require('../controllers/loaidocgia.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', c.getAll);
router.post('/', authorize('ADMIN', 'STAFF'), c.create);
router.put('/:id', authorize('ADMIN', 'STAFF'), c.update);
router.delete('/:id', authorize('ADMIN'), c.remove);

module.exports = router;

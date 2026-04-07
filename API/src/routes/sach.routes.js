const express = require('express');
const router = express.Router();
const c = require('../controllers/sach.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.use(authenticate);

// IMPORTANT: /search and /bulk must come before /:id
router.get('/search', c.search);
router.post('/bulk', authorize('ADMIN', 'STAFF'), upload.single('file'), c.bulkInsert);

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', authorize('ADMIN', 'STAFF'), c.create);
router.put('/:id', authorize('ADMIN', 'STAFF'), c.update);
router.delete('/:id', authorize('ADMIN', 'STAFF'), c.remove);

module.exports = router;

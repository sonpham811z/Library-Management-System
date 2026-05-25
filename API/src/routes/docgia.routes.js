const express = require('express');
const router = express.Router();
const c = require('../controllers/docgia.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadAvatar } = require('../config/cloudinary');

router.use(authenticate);

// IMPORTANT: specific routes before :id
router.get('/search', c.search);
router.get('/me', c.getMe);
router.patch('/avatar', uploadAvatar.single('avatar'), c.updateAvatar);
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', authorize('ADMIN', 'STAFF'), c.create);
router.put('/:id', authorize('ADMIN', 'STAFF'), c.update);
router.put('/:id/giahan', authorize('ADMIN', 'STAFF'), c.giaHan);
router.delete('/:id', authorize('ADMIN'), c.remove);

module.exports = router;

const express = require('express');
const router  = express.Router();
const c       = require('../controllers/datcho.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// IMPORTANT: named sub-paths before /:id
router.get('/my',          c.getMy);                              // READER: own reservations
router.post('/auto-cancel', authorize('ADMIN', 'STAFF'), c.autoCancelExpired); // manual trigger

router.get('/',  authorize('ADMIN', 'STAFF'), c.getAll);          // Staff: all reservations
router.post('/', authorize('READER'), c.create);                  // READER: reserve a title

// /:id actions
router.post('/:id/confirm', authorize('ADMIN', 'STAFF'), c.confirmReservation); // staff confirms pickup
router.patch('/:id/cancel', c.cancel);                            // cancel (ownership enforced in controller)

module.exports = router;

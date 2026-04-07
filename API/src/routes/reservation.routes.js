const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// READER: create and manage own reservations
router.post('/', authorize(ROLES.READER), reservationController.createReservation);
router.get('/my', reservationController.getMyReservations);
router.put('/:id/cancel', reservationController.cancelReservation);

module.exports = router;

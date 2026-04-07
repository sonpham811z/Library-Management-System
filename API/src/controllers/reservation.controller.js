const reservationService = require('../services/reservation.service');
const { sendSuccess, sendError } = require('../utils/response');

const createReservation = async (req, res, next) => {
  try {
    const { book_id } = req.body;
    if (!book_id) return sendError(res, 'book_id is required', 400);
    const reservation = await reservationService.createReservation(req.user.id, book_id);
    return sendSuccess(res, reservation, 'Reservation created successfully', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const result = await reservationService.cancelReservation(req.params.id, req.user.id);
    return sendSuccess(res, result, 'Reservation cancelled');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode);
    next(err);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await reservationService.getReaderReservations(req.user.id);
    return sendSuccess(res, reservations);
  } catch (err) {
    next(err);
  }
};

module.exports = { createReservation, cancelReservation, getMyReservations };

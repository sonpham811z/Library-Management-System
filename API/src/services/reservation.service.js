const { v4: uuidv4 } = require('uuid');
const reservationModel = require('../models/reservation.model');
const bookModel = require('../models/book.model');
const { checkCardValid } = require('./readerCard.service');
const { RESERVATION_STATUS } = require('../config/constants');

const createReservation = async (readerId, bookId) => {
  // 1. Check reader card
  const cardCheck = await checkCardValid(readerId);
  if (!cardCheck.valid) {
    throw { statusCode: 400, message: `Cannot reserve: ${cardCheck.reason}` };
  }

  // 2. Check book exists
  const book = await bookModel.findById(bookId);
  if (!book) throw { statusCode: 404, message: 'Book not found' };

  // 3. Check if book is available (no need to reserve available books)
  if (book.available_quantity > 0) {
    throw { statusCode: 400, message: 'Book is currently available. You can borrow it directly.' };
  }

  // 4. Check duplicate reservation
  const existing = await reservationModel.findByReaderAndBook(readerId, bookId);
  if (existing) {
    throw { statusCode: 409, message: 'You already have an active reservation for this book' };
  }

  const reservation = await reservationModel.create({
    id: uuidv4(),
    reader_id: readerId,
    book_id: bookId,
    status: RESERVATION_STATUS.PENDING,
    reserved_at: new Date().toISOString(),
  });

  return reservation;
};

const cancelReservation = async (reservationId, readerId) => {
  const supabase = require('../config/supabase');
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single();
  if (error) throw { statusCode: 404, message: 'Reservation not found' };
  if (data.reader_id !== readerId) throw { statusCode: 403, message: 'Forbidden' };

  return reservationModel.update(reservationId, { status: RESERVATION_STATUS.CANCELLED });
};

const getReaderReservations = async (readerId) => {
  return reservationModel.findByReader(readerId);
};

module.exports = { createReservation, cancelReservation, getReaderReservations };

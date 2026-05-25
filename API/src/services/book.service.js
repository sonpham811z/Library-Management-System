const { v4: uuidv4 } = require('uuid');
const bookModel = require('../models/book.model');
const policyModel = require('../models/policy.model');
const { BOOK_STATUS } = require('../config/constants');

const addBook = async (bookData) => {
  const policies = await policyModel.getAll();
  const maxAgeYears = parseInt(policies.MAX_BOOK_AGE_YEARS || 8);

  const currentYear = new Date().getFullYear();
  const publishYear = parseInt(bookData.publish_year);

  if (currentYear - publishYear > maxAgeYears) {
    throw {
      statusCode: 400,
      message: `Only books published within the last ${maxAgeYears} years are accepted. This book was published in ${publishYear}.`,
    };
  }

  return bookModel.create({
    id: uuidv4(),
    ...bookData,
    available_quantity: bookData.quantity,
    status: BOOK_STATUS.AVAILABLE,
    borrow_count: 0,
  });
};

const getBooks = async (filters) => {
  return bookModel.findAll(filters);
};

const getBookById = async (id) => {
  const book = await bookModel.findById(id);
  if (!book) throw { statusCode: 404, message: 'Book not found' };
  return book;
};

const getPopularBooks = async (limit) => {
  return bookModel.getPopular(limit);
};

const updateBook = async (id, updates) => {
  const book = await bookModel.findById(id);
  if (!book) throw { statusCode: 404, message: 'Book not found' };

  if (updates.publish_year) {
    const policies = await policyModel.getAll();
    const maxAgeYears = parseInt(policies.MAX_BOOK_AGE_YEARS || 8);
    const currentYear = new Date().getFullYear();
    if (currentYear - parseInt(updates.publish_year) > maxAgeYears) {
      throw {
        statusCode: 400,
        message: `Only books published within the last ${maxAgeYears} years are accepted.`,
      };
    }
  }

  return bookModel.update(id, updates);
};

const deleteBook = async (id) => {
  const book = await bookModel.findById(id);
  if (!book) throw { statusCode: 404, message: 'Book not found' };
  if (book.available_quantity < book.quantity) {
    throw { statusCode: 400, message: 'Cannot delete book: some copies are currently borrowed' };
  }
  await bookModel.remove(id);
};

module.exports = { addBook, getBooks, getBookById, getPopularBooks, updateBook, deleteBook };

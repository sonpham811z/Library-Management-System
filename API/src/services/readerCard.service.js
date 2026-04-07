const { v4: uuidv4 } = require('uuid');
const readerCardModel = require('../models/readerCard.model');
const userModel = require('../models/user.model');
const policyModel = require('../models/policy.model');
const { READER_CARD_STATUS } = require('../config/constants');

const createReaderCard = async (readerId) => {
  const user = await userModel.findById(readerId);
  if (!user) throw { statusCode: 404, message: 'Reader not found' };

  const policies = await policyModel.getAll();
  const minAge = parseInt(policies.MIN_READER_AGE || 18);
  const maxAge = parseInt(policies.MAX_READER_AGE || 55);
  const validityMonths = parseInt(policies.CARD_VALIDITY_MONTHS || 6);

  // Age validation
  if (!user.date_of_birth) throw { statusCode: 400, message: 'Reader date of birth is required' };

  const birthDate = new Date(user.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

  if (age < minAge || age > maxAge) {
    throw {
      statusCode: 400,
      message: `Reader age must be between ${minAge} and ${maxAge}. Current age: ${age}`,
    };
  }

  // Check existing active card
  const existing = await readerCardModel.findByReaderId(readerId);
  if (existing && existing.status === READER_CARD_STATUS.ACTIVE) {
    throw { statusCode: 409, message: 'Reader already has an active card' };
  }

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

  const card = await readerCardModel.create({
    id: uuidv4(),
    reader_id: readerId,
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: expiryDate.toISOString().split('T')[0],
    status: READER_CARD_STATUS.ACTIVE,
  });

  return card;
};

const getReaderCard = async (readerId) => {
  const card = await readerCardModel.findByReaderId(readerId);
  if (!card) throw { statusCode: 404, message: 'No reader card found' };
  return card;
};

const renewReaderCard = async (cardId) => {
  const card = await readerCardModel.findById(cardId);
  if (!card) throw { statusCode: 404, message: 'Card not found' };

  const policies = await policyModel.getAll();
  const validityMonths = parseInt(policies.CARD_VALIDITY_MONTHS || 6);

  const newExpiry = new Date();
  newExpiry.setMonth(newExpiry.getMonth() + validityMonths);

  return readerCardModel.update(cardId, {
    expiry_date: newExpiry.toISOString().split('T')[0],
    status: READER_CARD_STATUS.ACTIVE,
  });
};

const checkCardValid = async (readerId) => {
  const card = await readerCardModel.findByReaderId(readerId);
  if (!card) return { valid: false, reason: 'No reader card' };
  if (card.status !== READER_CARD_STATUS.ACTIVE) return { valid: false, reason: 'Card is not active' };

  const today = new Date();
  const expiry = new Date(card.expiry_date);
  if (expiry < today) {
    await readerCardModel.update(card.id, { status: READER_CARD_STATUS.EXPIRED });
    return { valid: false, reason: 'Card has expired' };
  }

  return { valid: true, card };
};

module.exports = { createReaderCard, getReaderCard, renewReaderCard, checkCardValid };

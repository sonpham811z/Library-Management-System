const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/user.model');
const { ROLES } = require('../config/constants');

// Who can create whom
const CREATION_RULES = {
  [ROLES.ADMIN]: [ROLES.STAFF, ROLES.READER],
  [ROLES.STAFF]: [ROLES.READER],
  [ROLES.READER]: [],
};

const createUser = async (creatorRole, userData) => {
  const { full_name, email, password, role, phone, date_of_birth } = userData;

  const allowed = CREATION_RULES[creatorRole] || [];
  if (!allowed.includes(role)) {
    throw { statusCode: 403, message: `You cannot create a user with role ${role}` };
  }

  const existing = await userModel.findByEmail(email);
  if (existing) throw { statusCode: 409, message: 'Email already exists' };

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await userModel.create({
    id: uuidv4(),
    full_name,
    email,
    password_hash: passwordHash,
    role,
    phone,
    date_of_birth,
    is_active: true,
  });

  return newUser;
};

const getUsers = async (filters) => {
  return userModel.findAll(filters);
};

const getUserById = async (id) => {
  const user = await userModel.findById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  const { password_hash, refresh_token, ...safeUser } = user;
  return safeUser;
};

const updateUser = async (requesterId, requesterRole, targetId, updates) => {
  // ADMIN can update anyone; users can only update themselves (limited fields)
  if (requesterRole !== ROLES.ADMIN && requesterId !== targetId) {
    throw { statusCode: 403, message: 'Forbidden' };
  }

  const allowed = ['full_name', 'phone', 'date_of_birth'];
  if (requesterRole === ROLES.ADMIN) allowed.push('is_active', 'role');

  const safeUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }

  return userModel.update(targetId, safeUpdates);
};

const deleteUser = async (id) => {
  await userModel.update(id, { is_active: false });
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };

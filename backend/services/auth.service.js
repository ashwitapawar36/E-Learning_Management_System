const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'elms_secure_jwt_secret_key_change_in_production_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async ({ name, email, password, role = 'student', bio = '' }) => {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing.rows.length > 0) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const insertQuery = `
    INSERT INTO users (name, email, password_hash, role, bio)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, avatar_url, bio, created_at;
  `;
  const result = await db.query(insertQuery, [
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    role,
    bio.trim()
  ]);

  const user = result.rows[0];
  const token = generateToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const result = await db.query(
    'SELECT id, name, email, password_hash, role, avatar_url, bio, created_at FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (result.rows.length === 0) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  delete user.password_hash;
  const token = generateToken(user);
  return { user, token };
};

const getProfile = async (userId) => {
  const result = await db.query(
    'SELECT id, name, email, role, avatar_url, bio, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const updateProfile = async (userId, { name, bio, avatar_url }) => {
  const result = await db.query(
    `UPDATE users 
     SET name = COALESCE($1, name),
         bio = COALESCE($2, bio),
         avatar_url = COALESCE($3, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, name, email, role, avatar_url, bio, updated_at`,
    [name, bio, avatar_url, userId]
  );
  return result.rows[0];
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};

const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elms_secure_jwt_secret_key_change_in_production_2026');

    // Verify user exists in database
    const userRes = await db.query(
      'SELECT id, name, email, role, avatar_url, bio FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    req.user = userRes.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elms_secure_jwt_secret_key_change_in_production_2026');
      const userRes = await db.query(
        'SELECT id, name, email, role, avatar_url, bio FROM users WHERE id = $1',
        [decoded.id]
      );
      if (userRes.rows.length > 0) {
        req.user = userRes.rows[0];
      }
    }
  } catch (err) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };

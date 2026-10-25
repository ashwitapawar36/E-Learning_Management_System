const crypto = require('crypto');

/**
 * Generates a cryptographically secure, human-readable course enrollment key.
 * Format: ELMS-XXXX-XXXX (e.g., ELMS-9A4F-2C8B)
 * Provides 32 bits of entropy (>4.29 billion unique keys) with high readability.
 */
function generateSecureEnrollmentKey() {
  const buf = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ELMS-${buf.slice(0, 4)}-${buf.slice(4, 8)}`;
}

module.exports = {
  generateSecureEnrollmentKey
};

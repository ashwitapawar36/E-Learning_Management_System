const db = require('../config/db');

const getUserNotifications = async (userId) => {
  const result = await db.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50;`,
    [userId]
  );
  return result.rows;
};

const markAsRead = async (notificationId, userId) => {
  const result = await db.query(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE id = $1 AND user_id = $2 
     RETURNING *;`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

const markAllAsRead = async (userId) => {
  await db.query(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE user_id = $1 AND is_read = FALSE;`,
    [userId]
  );
  return { success: true, message: 'All notifications marked as read.' };
};

const createNotification = async ({ user_id, title, message, type = 'general', link = null }) => {
  const result = await db.query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *;`,
    [user_id, title, message, type, link]
  );
  return result.rows[0];
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};

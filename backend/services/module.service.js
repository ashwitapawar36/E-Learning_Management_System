const db = require('../config/db');

const getModulesByCourse = async (courseId) => {
  const result = await db.query(
    'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index ASC, id ASC',
    [courseId]
  );
  return result.rows;
};

const createModule = async ({ course_id, title, description, order_index = 1 }) => {
  const result = await db.query(
    `INSERT INTO modules (course_id, title, description, order_index)
     VALUES ($1, $2, $3, $4)
     RETURNING *;`,
    [course_id, title.trim(), description ? description.trim() : null, order_index]
  );
  return result.rows[0];
};

const updateModule = async (moduleId, { title, description, order_index }) => {
  const result = await db.query(
    `UPDATE modules 
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         order_index = COALESCE($3, order_index),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *;`,
    [title, description, order_index, moduleId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Module not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

const deleteModule = async (moduleId) => {
  const result = await db.query('DELETE FROM modules WHERE id = $1 RETURNING id', [moduleId]);
  if (result.rows.length === 0) {
    const error = new Error('Module not found.');
    error.statusCode = 404;
    throw error;
  }
  return { success: true, message: 'Module deleted successfully.' };
};

module.exports = {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule
};

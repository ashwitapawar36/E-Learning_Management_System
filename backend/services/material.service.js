const db = require('../config/db');

const getMaterialsByModule = async (moduleId) => {
  const result = await db.query(
    'SELECT * FROM course_materials WHERE module_id = $1 ORDER BY order_index ASC, id ASC',
    [moduleId]
  );
  return result.rows;
};

const createMaterial = async ({ module_id, title, material_type, file_url = null, content = null, order_index = 1 }) => {
  const result = await db.query(
    `INSERT INTO course_materials (module_id, title, material_type, file_url, content, order_index)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [module_id, title.trim(), material_type, file_url, content, order_index]
  );
  return result.rows[0];
};

const updateMaterial = async (materialId, { title, material_type, file_url, content, order_index }) => {
  const result = await db.query(
    `UPDATE course_materials 
     SET title = COALESCE($1, title),
         material_type = COALESCE($2, material_type),
         file_url = COALESCE($3, file_url),
         content = COALESCE($4, content),
         order_index = COALESCE($5, order_index)
     WHERE id = $6
     RETURNING *;`,
    [title, material_type, file_url, content, order_index, materialId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Material not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

const deleteMaterial = async (materialId) => {
  const result = await db.query('DELETE FROM course_materials WHERE id = $1 RETURNING id', [materialId]);
  if (result.rows.length === 0) {
    const error = new Error('Material not found.');
    error.statusCode = 404;
    throw error;
  }
  return { success: true, message: 'Material deleted successfully.' };
};

module.exports = {
  getMaterialsByModule,
  createMaterial,
  updateMaterial,
  deleteMaterial
};

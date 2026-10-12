const db = require('../config/db');

const getAssignmentsByCourse = async (courseId, studentId = null) => {
  const query = `
    SELECT 
      a.id, a.course_id, a.module_id, a.title, a.description, a.due_date, a.max_points, a.attachment_url, a.status, a.grades_released, a.created_at,
      m.title AS module_title,
      COUNT(s.id)::int AS total_submissions_count,
      COUNT(CASE WHEN s.status = 'graded' THEN 1 END)::int AS graded_submissions_count
      ${studentId ? `, s_sub.id AS student_submission_id, 
         CASE WHEN a.grades_released = TRUE THEN s_sub.status ELSE (CASE WHEN s_sub.id IS NOT NULL THEN 'submitted' ELSE NULL END) END AS student_status, 
         CASE WHEN a.grades_released = TRUE THEN s_sub.grade ELSE NULL END AS grade, 
         CASE WHEN a.grades_released = TRUE THEN s_sub.feedback ELSE NULL END AS feedback, 
         s_sub.submitted_at, s_sub.file_url AS student_file_url` : ''}
    FROM assignments a
    LEFT JOIN modules m ON a.module_id = m.id
    LEFT JOIN submissions s ON a.id = s.assignment_id
    ${studentId ? `LEFT JOIN submissions s_sub ON a.id = s_sub.assignment_id AND s_sub.student_id = $2` : ''}
    WHERE a.course_id = $1
    GROUP BY a.id, m.title ${studentId ? ', s_sub.id, s_sub.status, s_sub.grade, s_sub.feedback, s_sub.submitted_at, s_sub.file_url' : ''}
    ORDER BY a.due_date ASC;
  `;

  const params = [courseId];
  if (studentId) params.push(studentId);

  const result = await db.query(query, params);
  return result.rows;
};

const getAssignmentById = async (assignmentId, userId = null, role = null) => {
  const query = `
    SELECT 
      a.id, a.course_id, a.module_id, a.title, a.description, a.due_date, a.max_points, a.attachment_url, a.status, a.grades_released, a.created_at,
      c.title AS course_title, c.instructor_id,
      m.title AS module_title,
      u_inst.name AS instructor_name
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    JOIN users u_inst ON c.instructor_id = u_inst.id
    LEFT JOIN modules m ON a.module_id = m.id
    WHERE a.id = $1;
  `;
  const result = await db.query(query, [assignmentId]);

  if (result.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  const assignment = result.rows[0];

  // If student is querying, fetch their specific submission and mask if unreleased
  if (userId && role === 'student') {
    const subRes = await db.query(
      `SELECT s.*, u.name as grader_name 
       FROM submissions s 
       LEFT JOIN users u ON s.graded_by = u.id 
       WHERE s.assignment_id = $1 AND s.student_id = $2`,
      [assignmentId, userId]
    );
    const sub = subRes.rows[0] || null;
    if (sub && assignment.grades_released === false) {
      sub.grade = null;
      sub.feedback = null;
      sub.grader_name = null;
      sub.graded_at = null;
      if (sub.status === 'graded') sub.status = 'submitted';
    }
    assignment.student_submission = sub;
  }

  // If instructor of this course is querying, fetch summary stats
  if (userId && (role === 'instructor' || role === 'admin')) {
    const statsRes = await db.query(
      `SELECT 
        COUNT(s.id)::int AS total_submissions,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END)::int AS graded_count,
        COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)::int AS pending_count,
        AVG(s.grade)::numeric(5,2) AS average_grade
       FROM submissions s
       WHERE s.assignment_id = $1`,
      [assignmentId]
    );
    assignment.stats = statsRes.rows[0];
  }

  return assignment;
};

const createAssignment = async ({ course_id, module_id, title, description, due_date, max_points = 100, attachment_url = null, status = 'published' }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO assignments (course_id, module_id, title, description, due_date, max_points, attachment_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const res = await client.query(insertQuery, [
      course_id,
      module_id || null,
      title.trim(),
      description.trim(),
      due_date,
      parseInt(max_points, 10) || 100,
      attachment_url,
      status
    ]);
    const assignment = res.rows[0];

    // Notify all active students in the course
    const studentsRes = await client.query(
      'SELECT student_id FROM enrollments WHERE course_id = $1 AND status = \'active\'',
      [course_id]
    );

    for (const student of studentsRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'assignment', $4);`,
        [
          student.student_id,
          'New Assignment Published',
          `New assignment "${title}" has been added to your course. Due: ${new Date(due_date).toLocaleDateString()}.`,
          `/student/assignments`
        ]
      );
    }

    await client.query('COMMIT');
    return assignment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateAssignment = async (assignmentId, { module_id, title, description, due_date, max_points, attachment_url, status, grades_released }) => {
  const query = `
    UPDATE assignments 
    SET module_id = COALESCE($1, module_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        due_date = COALESCE($4, due_date),
        max_points = COALESCE($5, max_points),
        attachment_url = COALESCE($6, attachment_url),
        status = COALESCE($7, status),
        grades_released = COALESCE($8, grades_released),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING *;
  `;
  const result = await db.query(query, [module_id, title, description, due_date, max_points, attachment_url, status, grades_released !== undefined ? grades_released : null, assignmentId]);

  if (result.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

const toggleGradeRelease = async (assignmentId, grades_released) => {
  const result = await db.query(
    `UPDATE assignments SET grades_released = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`,
    [Boolean(grades_released), assignmentId]
  );
  if (result.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const deleteAssignment = async (assignmentId) => {
  const result = await db.query('DELETE FROM assignments WHERE id = $1 RETURNING id', [assignmentId]);
  if (result.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }
  return { success: true, message: 'Assignment deleted successfully.' };
};

const getStudentAllAssignments = async (studentId) => {
  const query = `
    SELECT 
      a.id AS assignment_id, a.title AS assignment_title, a.description, a.due_date, a.max_points, a.attachment_url, a.grades_released,
      c.id AS course_id, c.title AS course_title,
      u.name AS instructor_name,
      s.id AS submission_id, s.file_url AS submission_file_url, s.content AS submission_content,
      s.submitted_at, 
      CASE WHEN a.grades_released = TRUE THEN s.grade ELSE NULL END AS grade,
      CASE WHEN a.grades_released = TRUE THEN s.feedback ELSE NULL END AS feedback,
      CASE WHEN a.grades_released = TRUE THEN s.status ELSE (CASE WHEN s.id IS NOT NULL THEN 'submitted' ELSE NULL END) END AS submission_status,
      CASE 
        WHEN s.id IS NOT NULL AND s.status = 'graded' AND a.grades_released = TRUE THEN 'graded'
        WHEN s.id IS NOT NULL THEN 'submitted'
        WHEN a.due_date < CURRENT_TIMESTAMP THEN 'overdue'
        ELSE 'pending'
      END AS overall_status
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    JOIN assignments a ON c.id = a.course_id
    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
    WHERE e.student_id = $1 AND e.status = 'active' AND a.status = 'published'
    ORDER BY a.due_date ASC;
  `;
  const result = await db.query(query, [studentId]);
  return result.rows;
};

module.exports = {
  getAssignmentsByCourse,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  toggleGradeRelease,
  deleteAssignment,
  getStudentAllAssignments
};


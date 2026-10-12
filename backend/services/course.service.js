const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllCourses = async ({ search, category, status = 'published', studentId = null }) => {
  let query = `
    SELECT 
      c.id, c.title, c.description, c.instructor_id, c.category, c.thumbnail_url, c.status, c.created_at,
      c.max_capacity, c.enrollment_deadline, c.requires_enrollment_key,
      u.name AS instructor_name, u.email AS instructor_email,
      COUNT(DISTINCT e.id)::int AS enrolled_students_count,
      COUNT(DISTINCT m.id)::int AS modules_count,
      COUNT(DISTINCT a.id)::int AS assignments_count
      ${studentId ? `, BOOL_OR(e.student_id = $${studentId ? 1 : 0} AND e.status = 'active') AS is_enrolled` : ''}
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
    LEFT JOIN modules m ON c.id = m.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    WHERE 1=1
  `;

  const params = [];
  if (studentId) {
    params.push(studentId);
  }

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND c.status = $${params.length}`;
  }

  if (category && category !== 'All') {
    params.push(category);
    query += ` AND c.category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
  }

  query += `
    GROUP BY c.id, u.id
    ORDER BY c.created_at DESC
  `;

  const result = await db.query(query, params);
  return result.rows;
};

const getCourseById = async (courseId, studentId = null) => {
  // 1. Get Course Info & Instructor (Never expose enrollment_key_hash)
  const courseQuery = `
    SELECT 
      c.id, c.title, c.description, c.instructor_id, c.category, c.thumbnail_url, c.status, c.created_at,
      c.max_capacity, c.enrollment_deadline, c.requires_enrollment_key,
      (c.enrollment_key_hash IS NOT NULL) AS has_enrollment_key,
      u.name AS instructor_name, u.email AS instructor_email, u.bio AS instructor_bio,
      COUNT(DISTINCT e.id)::int AS enrolled_students_count
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
    WHERE c.id = $1
    GROUP BY c.id, u.id
  `;
  const courseRes = await db.query(courseQuery, [courseId]);

  if (courseRes.rows.length === 0) {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }

  const course = courseRes.rows[0];

  // 2. Check student enrollment and activity completion map if studentId is provided
  course.is_enrolled = false;
  course.progress_percentage = 0;
  course.completed_activities_count = 0;
  course.total_activities_count = 0;

  const completedMap = new Map();

  if (studentId) {
    const enrollRes = await db.query(
      'SELECT id, status, progress_percentage, enrolled_at FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, studentId]
    );
    if (enrollRes.rows.length > 0 && ['active', 'completed'].includes(enrollRes.rows[0].status)) {
      course.is_enrolled = true;
      course.enrolled_at = enrollRes.rows[0].enrolled_at;

      // Fetch student activity completions for this course
      const compRes = await db.query(
        'SELECT activity_type, activity_id, completed_at FROM activity_completions WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );
      for (const row of compRes.rows) {
        completedMap.set(`${row.activity_type}_${row.activity_id}`, row.completed_at);
      }
    }
  }

  // 3. Get Modules and their Materials
  const modulesRes = await db.query(
    'SELECT id, course_id, title, description, order_index, created_at FROM modules WHERE course_id = $1 ORDER BY order_index ASC, id ASC',
    [courseId]
  );
  const modules = modulesRes.rows;

  let totalMaterialsCount = 0;

  if (modules.length > 0) {
    const moduleIds = modules.map(m => m.id);
    const materialsRes = await db.query(
      `SELECT id, module_id, title, material_type, file_url, content, order_index, created_at 
       FROM course_materials 
       WHERE module_id = ANY($1::int[]) 
       ORDER BY order_index ASC, id ASC`,
      [moduleIds]
    );

    totalMaterialsCount = materialsRes.rows.length;

    const materialsByModule = {};
    materialsRes.rows.forEach(mat => {
      const key = `material_${mat.id}`;
      mat.completed = completedMap.has(key);
      mat.completed_at = completedMap.get(key) || null;

      if (!materialsByModule[mat.module_id]) {
        materialsByModule[mat.module_id] = [];
      }
      materialsByModule[mat.module_id].push(mat);
    });

    modules.forEach(m => {
      m.materials = materialsByModule[m.id] || [];
    });
  }

  course.modules = modules;

  // 4. Get Assignments for this Course
  let assignmentsQuery = `
    SELECT 
      a.id, a.course_id, a.module_id, a.title, a.description, a.due_date, a.max_points, a.attachment_url, a.status, a.grades_released, a.created_at,
      COUNT(s.id)::int AS submissions_count
      ${studentId ? `, s_sub.id AS student_submission_id, s_sub.status AS submission_status, 
        CASE WHEN a.grades_released = TRUE THEN s_sub.grade ELSE NULL END AS grade,
        CASE WHEN a.grades_released = TRUE THEN s_sub.feedback ELSE NULL END AS feedback,
        s_sub.submitted_at` : ''}
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    ${studentId ? `LEFT JOIN submissions s_sub ON a.id = s_sub.assignment_id AND s_sub.student_id = $2` : ''}
    WHERE a.course_id = $1
    GROUP BY a.id ${studentId ? ', s_sub.id, s_sub.status, s_sub.grade, s_sub.feedback, s_sub.submitted_at' : ''}
    ORDER BY a.due_date ASC
  `;

  const assignParams = [courseId];
  if (studentId) assignParams.push(studentId);

  const assignRes = await db.query(assignmentsQuery, assignParams);
  const assignments = assignRes.rows;

  assignments.forEach(a => {
    const key = `assignment_${a.id}`;
    a.completed = completedMap.has(key);
    a.completed_at = completedMap.get(key) || null;
  });

  course.assignments = assignments;

  // 5. Compute real activity metrics
  const publishedAssignmentsCount = assignments.filter(a => a.status === 'published').length;
  course.total_activities_count = totalMaterialsCount + publishedAssignmentsCount;

  if (course.is_enrolled && studentId) {
    let completedCount = 0;
    // Count completed materials
    modules.forEach(m => {
      m.materials?.forEach(mat => {
        if (mat.completed) completedCount++;
      });
    });
    // Count completed published assignments
    assignments.forEach(a => {
      if (a.status === 'published' && a.completed) completedCount++;
    });

    course.completed_activities_count = completedCount;
    course.progress_percentage = course.total_activities_count > 0 
      ? Math.round((completedCount / course.total_activities_count) * 100) 
      : 0;

    // Automatically synchronize database enrollments table
    await db.query(
      `UPDATE enrollments 
       SET progress_percentage = $1,
           status = CASE WHEN $1 = 100 THEN 'completed' ELSE 'active' END
       WHERE student_id = $2 AND course_id = $3`,
      [course.progress_percentage, studentId, courseId]
    );
  }

  return course;
};

const getInstructorCourses = async (instructorId) => {
  const query = `
    SELECT 
      c.id, c.title, c.description, c.category, c.thumbnail_url, c.status, c.created_at,
      c.max_capacity, c.enrollment_deadline, c.requires_enrollment_key,
      (c.enrollment_key_hash IS NOT NULL) AS has_enrollment_key,
      COUNT(DISTINCT e.id)::int AS enrolled_students_count,
      COUNT(DISTINCT m.id)::int AS modules_count,
      COUNT(DISTINCT a.id)::int AS assignments_count,
      COUNT(DISTINCT s.id)::int AS total_submissions_count,
      COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'resubmitted') THEN s.id END)::int AS pending_grading_count
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
    LEFT JOIN modules m ON c.id = m.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    LEFT JOIN submissions s ON a.id = s.assignment_id
    WHERE c.instructor_id = $1
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  const result = await db.query(query, [instructorId]);
  return result.rows;
};

const createCourse = async ({ 
  title, 
  description, 
  instructor_id, 
  category = 'Computer Science', 
  thumbnail_url = null, 
  status = 'published',
  max_capacity = 50,
  enrollment_deadline = null,
  requires_enrollment_key = false,
  enrollment_key = null
}) => {
  const isKeyRequired = requires_enrollment_key === true || requires_enrollment_key === 'true';
  let enrollment_key_hash = null;

  if (isKeyRequired) {
    if (!enrollment_key || enrollment_key.trim().length < 6) {
      const error = new Error('Enrollment key must contain at least 6 characters.');
      error.statusCode = 400;
      throw error;
    }
    enrollment_key_hash = await bcrypt.hash(enrollment_key.trim(), 10);
  }

  const query = `
    INSERT INTO courses (
      title, description, instructor_id, category, thumbnail_url, status, 
      max_capacity, enrollment_deadline, requires_enrollment_key, enrollment_key_hash
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, title, description, instructor_id, category, thumbnail_url, status, 
              max_capacity, enrollment_deadline, requires_enrollment_key, 
              (enrollment_key_hash IS NOT NULL) AS has_enrollment_key, created_at;
  `;
  const result = await db.query(query, [
    title.trim(), 
    description ? description.trim() : null, 
    instructor_id, 
    category, 
    thumbnail_url, 
    status,
    parseInt(max_capacity, 10) || 50,
    enrollment_deadline || null,
    isKeyRequired,
    enrollment_key_hash
  ]);
  return result.rows[0];
};

const updateCourse = async (courseId, instructorId, { 
  title, 
  description, 
  category, 
  thumbnail_url, 
  status,
  max_capacity,
  enrollment_deadline,
  requires_enrollment_key,
  enrollment_key
}) => {
  const check = await db.query('SELECT instructor_id, requires_enrollment_key, enrollment_key_hash FROM courses WHERE id = $1', [courseId]);
  if (check.rows.length === 0) {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }
  if (check.rows[0].instructor_id !== instructorId) {
    const error = new Error('Unauthorized to modify this course.');
    error.statusCode = 403;
    throw error;
  }

  let isKeyRequired = check.rows[0].requires_enrollment_key;
  let keyHash = check.rows[0].enrollment_key_hash;

  if (requires_enrollment_key !== undefined) {
    isKeyRequired = requires_enrollment_key === true || requires_enrollment_key === 'true';
    if (isKeyRequired) {
      if (enrollment_key && enrollment_key.trim()) {
        const trimmed = enrollment_key.trim();
        if (trimmed.length < 6) {
          const error = new Error('Enrollment key must contain at least 6 characters.');
          error.statusCode = 400;
          throw error;
        }
        keyHash = await bcrypt.hash(trimmed, 10);
      } else if (!keyHash) {
        const error = new Error('An enrollment key of at least 6 characters is required when enabling enrollment keys.');
        error.statusCode = 400;
        throw error;
      }
    }
  } else if (enrollment_key && enrollment_key.trim()) {
    const trimmed = enrollment_key.trim();
    if (trimmed.length < 6) {
      const error = new Error('Enrollment key must contain at least 6 characters.');
      error.statusCode = 400;
      throw error;
    }
    keyHash = await bcrypt.hash(trimmed, 10);
  }

  const query = `
    UPDATE courses 
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        thumbnail_url = COALESCE($4, thumbnail_url),
        status = COALESCE($5, status),
        max_capacity = COALESCE($6, max_capacity),
        enrollment_deadline = COALESCE($7, enrollment_deadline),
        requires_enrollment_key = COALESCE($8, requires_enrollment_key),
        enrollment_key_hash = COALESCE($9, enrollment_key_hash),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING id, title, description, instructor_id, category, thumbnail_url, status, 
              max_capacity, enrollment_deadline, requires_enrollment_key, 
              (enrollment_key_hash IS NOT NULL) AS has_enrollment_key, created_at, updated_at;
  `;
  const result = await db.query(query, [
    title, 
    description, 
    category, 
    thumbnail_url, 
    status, 
    max_capacity ? parseInt(max_capacity, 10) : null,
    enrollment_deadline,
    requires_enrollment_key !== undefined ? isKeyRequired : null,
    (requires_enrollment_key !== undefined || enrollment_key) ? keyHash : null,
    courseId
  ]);
  return result.rows[0];
};

const updateEnrollmentSettings = async (courseId, instructorId, { requires_enrollment_key, enrollment_key }) => {
  const check = await db.query('SELECT instructor_id, enrollment_key_hash FROM courses WHERE id = $1', [courseId]);
  if (check.rows.length === 0) {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }
  if (check.rows[0].instructor_id !== instructorId) {
    const error = new Error('Unauthorized to modify enrollment settings for this course.');
    error.statusCode = 403;
    throw error;
  }

  const isKeyRequired = requires_enrollment_key === true || requires_enrollment_key === 'true';
  let keyHash = check.rows[0].enrollment_key_hash;

  if (isKeyRequired) {
    if (enrollment_key && enrollment_key.trim()) {
      const trimmed = enrollment_key.trim();
      if (trimmed.length < 6) {
        const error = new Error('Enrollment key must contain at least 6 characters.');
        error.statusCode = 400;
        throw error;
      }
      keyHash = await bcrypt.hash(trimmed, 10);
    } else if (!keyHash) {
      const error = new Error('An enrollment key of at least 6 characters is required when enabling enrollment keys.');
      error.statusCode = 400;
      throw error;
    }
  }

  const query = `
    UPDATE courses 
    SET requires_enrollment_key = $1,
        enrollment_key_hash = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING id, title, requires_enrollment_key, (enrollment_key_hash IS NOT NULL) AS has_enrollment_key, updated_at;
  `;
  const result = await db.query(query, [isKeyRequired, keyHash, courseId]);
  return result.rows[0];
};

const deleteCourse = async (courseId, instructorId) => {
  const check = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
  if (check.rows.length === 0) {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }
  if (check.rows[0].instructor_id !== instructorId) {
    const error = new Error('Unauthorized to delete this course.');
    error.statusCode = 403;
    throw error;
  }

  await db.query('DELETE FROM courses WHERE id = $1', [courseId]);
  return { success: true, message: 'Course deleted successfully.' };
};

module.exports = {
  getAllCourses,
  getCourseById,
  getInstructorCourses,
  createCourse,
  updateCourse,
  updateEnrollmentSettings,
  deleteCourse
};

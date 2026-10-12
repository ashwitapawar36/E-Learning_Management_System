const db = require('../config/db');
const activityService = require('./activity.service');
const bcrypt = require('bcryptjs');

// In-memory rate limiter for failed enrollment key attempts (max 5 failed attempts per 15 mins)
const failedAttempts = new Map();

const getRateLimitRecord = (key) => {
  const record = failedAttempts.get(key);
  if (record && record.resetAt <= Date.now()) {
    failedAttempts.delete(key);
    return null;
  }
  return record;
};

const recordFailedAttempt = (key) => {
  const now = Date.now();
  const existing = getRateLimitRecord(key);
  if (existing) {
    existing.count += 1;
  } else {
    failedAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
};

const enrollStudent = async (studentId, courseId, enrollmentKey = null) => {
  const rateLimitKey = `${studentId}:${courseId}`;
  const rateLimitRecord = getRateLimitRecord(rateLimitKey);
  if (rateLimitRecord && rateLimitRecord.count >= 5) {
    const waitMinutes = Math.ceil((rateLimitRecord.resetAt - Date.now()) / 60000);
    const err = new Error(`Too many failed enrollment attempts. Please wait ${waitMinutes} minute(s) before trying again.`);
    err.statusCode = 429;
    throw err;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify course exists, is published, and inspect capacity, deadline & key requirements
    const courseRes = await client.query(
      `SELECT id, title, instructor_id, status, max_capacity, enrollment_deadline,
              requires_enrollment_key, enrollment_key_hash 
       FROM courses 
       WHERE id = $1`,
      [courseId]
    );

    if (courseRes.rows.length === 0) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      throw err;
    }

    const course = courseRes.rows[0];
    if (course.status !== 'published') {
      const err = new Error('Cannot enroll in an unpublished course.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate course enrollment key if required
    if (course.requires_enrollment_key) {
      if (!enrollmentKey || typeof enrollmentKey !== 'string' || !enrollmentKey.trim()) {
        recordFailedAttempt(rateLimitKey);
        const err = new Error('Incorrect enrollment key. Please check the key provided by your instructor and try again.');
        err.statusCode = 400;
        throw err;
      }

      const isMatch = course.enrollment_key_hash
        ? await bcrypt.compare(enrollmentKey.trim(), course.enrollment_key_hash)
        : false;

      if (!isMatch) {
        recordFailedAttempt(rateLimitKey);
        const err = new Error('Incorrect enrollment key. Please check the key provided by your instructor and try again.');
        err.statusCode = 400;
        throw err;
      }

      // Successful key verification - clear failed attempt tracking
      failedAttempts.delete(rateLimitKey);
    }

    // Check enrollment deadline validation (Requirement 8)
    if (course.enrollment_deadline && new Date() > new Date(course.enrollment_deadline)) {
      const err = new Error(`Enrollment deadline for this course ended on ${new Date(course.enrollment_deadline).toLocaleDateString()}.`);
      err.statusCode = 400;
      throw err;
    }

    // Check course maximum capacity validation (Requirement 8)
    if (course.max_capacity) {
      const countRes = await client.query(
        `SELECT COUNT(*)::int AS active_count 
         FROM enrollments 
         WHERE course_id = $1 AND status = 'active'`,
        [courseId]
      );
      const activeCount = countRes.rows[0]?.active_count || 0;
      if (activeCount >= course.max_capacity) {
        const err = new Error(`Course has reached its maximum capacity of ${course.max_capacity} students.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Check if already enrolled
    const checkRes = await client.query(
      'SELECT id, status FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    let enrollment;
    if (checkRes.rows.length > 0) {
      if (checkRes.rows[0].status === 'active' || checkRes.rows[0].status === 'completed') {
        const err = new Error('You are already actively enrolled in this course.');
        err.statusCode = 409;
        throw err;
      }
      // Re-activate dropped enrollment
      const reactivateRes = await client.query(
        `UPDATE enrollments 
         SET status = 'active', enrolled_at = CURRENT_TIMESTAMP 
         WHERE student_id = $1 AND course_id = $2 
         RETURNING *;`,
        [studentId, courseId]
      );
      enrollment = reactivateRes.rows[0];
    } else {
      // Insert new enrollment (starts at 0% until student completes activities)
      const insertRes = await client.query(
        `INSERT INTO enrollments (student_id, course_id, status, progress_percentage)
         VALUES ($1, $2, 'active', 0)
         RETURNING *;`,
        [studentId, courseId]
      );
      enrollment = insertRes.rows[0];
    }

    // 3. Create notifications
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'enrollment', $4);`,
      [
        studentId,
        'Enrollment Confirmed!',
        `You have successfully enrolled in "${course.title}". Start learning now!`,
        `/student/courses/${courseId}`
      ]
    );

    const studentRes = await client.query('SELECT name FROM users WHERE id = $1', [studentId]);
    const studentName = studentRes.rows[0]?.name || 'A student';
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'enrollment', $4);`,
      [
        course.instructor_id,
        'New Student Enrolled',
        `${studentName} enrolled in your course "${course.title}".`,
        `/instructor/courses/${courseId}`
      ]
    );

    await client.query('COMMIT');
    return enrollment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const dropEnrollment = async (studentId, courseId) => {
  const result = await db.query(
    `UPDATE enrollments 
     SET status = 'dropped' 
     WHERE student_id = $1 AND course_id = $2 AND status = 'active'
     RETURNING *;`,
    [studentId, courseId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Active enrollment not found.');
    error.statusCode = 404;
    throw error;
  }

  return { success: true, message: 'Successfully dropped the course.' };
};

const getStudentEnrollments = async (studentId) => {
  const query = `
    SELECT 
      e.id AS enrollment_id, e.enrolled_at, e.status AS enrollment_status,
      COALESCE(
        ROUND(
          (COUNT(DISTINCT ac.id)::numeric / 
           NULLIF(
             (SELECT COUNT(*) FROM course_materials cm2 JOIN modules m2 ON cm2.module_id = m2.id WHERE m2.course_id = c.id) +
             (SELECT COUNT(*) FROM assignments a2 WHERE a2.course_id = c.id AND a2.status = 'published'),
             0
           )::numeric
          ) * 100
        ),
        0
      )::int AS progress_percentage,
      (SELECT COUNT(*) FROM course_materials cm2 JOIN modules m2 ON cm2.module_id = m2.id WHERE m2.course_id = c.id) +
      (SELECT COUNT(*) FROM assignments a2 WHERE a2.course_id = c.id AND a2.status = 'published') AS total_activities_count,
      COUNT(DISTINCT ac.id)::int AS completed_activities_count,
      c.id AS course_id, c.title AS course_title, c.description, c.category, c.thumbnail_url,
      c.max_capacity, c.enrollment_deadline,
      u.name AS instructor_name, u.email AS instructor_email,
      COUNT(DISTINCT m.id)::int AS modules_count,
      COUNT(DISTINCT a.id)::int AS assignments_count,
      COUNT(DISTINCT s.id)::int AS completed_submissions_count,
      (
        SELECT json_build_object(
          'id', next_a.id,
          'title', next_a.title,
          'due_date', next_a.due_date
        )
        FROM assignments next_a
        WHERE next_a.course_id = c.id 
          AND next_a.due_date > CURRENT_TIMESTAMP
          AND NOT EXISTS (
            SELECT 1 FROM submissions sub 
            WHERE sub.assignment_id = next_a.id AND sub.student_id = $1
          )
        ORDER BY next_a.due_date ASC
        LIMIT 1
      ) AS upcoming_assignment
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    LEFT JOIN activity_completions ac ON ac.student_id = $1 AND ac.course_id = c.id
    LEFT JOIN modules m ON c.id = m.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
    WHERE e.student_id = $1 AND e.status IN ('active', 'completed')
    GROUP BY e.id, c.id, u.id
    ORDER BY e.enrolled_at DESC;
  `;
  const result = await db.query(query, [studentId]);
  return result.rows;
};

const getCourseEnrollments = async (courseId, instructorId) => {
  const check = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
  if (check.rows.length === 0) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  const query = `
    SELECT 
      e.id AS enrollment_id, e.enrolled_at, e.status,
      u.id AS student_id, u.name AS student_name, u.email AS student_email, u.avatar_url,
      COUNT(DISTINCT ac.id)::int AS completed_activities_count,
      (
        (SELECT COUNT(*) FROM course_materials cm2 JOIN modules m2 ON cm2.module_id = m2.id WHERE m2.course_id = c.id) +
        (SELECT COUNT(*) FROM assignments a2 WHERE a2.course_id = c.id AND a2.status = 'published')
      )::int AS total_activities_count,
      COALESCE(
        ROUND(
          (COUNT(DISTINCT ac.id)::numeric / 
           NULLIF(
             (SELECT COUNT(*) FROM course_materials cm2 JOIN modules m2 ON cm2.module_id = m2.id WHERE m2.course_id = c.id) +
             (SELECT COUNT(*) FROM assignments a2 WHERE a2.course_id = c.id AND a2.status = 'published'),
             0
           )::numeric
          ) * 100
        ),
        0
      )::int AS progress_percentage,
      COUNT(DISTINCT s.id)::int AS total_submissions,
      AVG(CASE WHEN a.grades_released = TRUE THEN s.grade ELSE NULL END)::numeric(5, 2) AS average_grade
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON e.student_id = u.id
    LEFT JOIN activity_completions ac ON ac.student_id = u.id AND ac.course_id = c.id
    LEFT JOIN assignments a ON a.course_id = e.course_id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
    WHERE e.course_id = $1
    GROUP BY e.id, c.id, u.id
    ORDER BY e.enrolled_at DESC;
  `;
  const result = await db.query(query, [courseId]);
  return result.rows;
};

/**
 * Recalculates database-backed course progress for a student.
 * Students cannot arbitrarily submit manual progress percentages.
 */
const recalculateProgress = async (studentId, courseId) => {
  return await activityService.getCourseProgress(courseId, studentId);
};

module.exports = {
  enrollStudent,
  dropEnrollment,
  getStudentEnrollments,
  getCourseEnrollments,
  recalculateProgress
};

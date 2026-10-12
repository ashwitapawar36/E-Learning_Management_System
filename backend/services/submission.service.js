const db = require('../config/db');

const submitAssignment = async ({ assignment_id, student_id, file_url = null, content = null }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Check assignment details
    const assignRes = await client.query(
      `SELECT a.id, a.course_id, a.title, a.due_date, c.instructor_id, c.title AS course_title
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignment_id]
    );

    if (assignRes.rows.length === 0) {
      const err = new Error('Assignment not found.');
      err.statusCode = 404;
      throw err;
    }

    const assignment = assignRes.rows[0];

    // 2. Check if student is actively enrolled
    const enrollCheck = await client.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status IN ('active', 'completed')",
      [student_id, assignment.course_id]
    );

    if (enrollCheck.rows.length === 0) {
      const err = new Error('You must be enrolled in this course to submit assignments.');
      err.statusCode = 403;
      throw err;
    }

    // Determine status (submitted or late)
    const isLate = new Date() > new Date(assignment.due_date);
    const submissionStatus = isLate ? 'late' : 'submitted';

    // 3. Upsert submission
    const upsertQuery = `
      INSERT INTO submissions (assignment_id, student_id, file_url, content, submitted_at, status)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      ON CONFLICT (assignment_id, student_id)
      DO UPDATE SET
        file_url = COALESCE(EXCLUDED.file_url, submissions.file_url),
        content = COALESCE(EXCLUDED.content, submissions.content),
        submitted_at = CURRENT_TIMESTAMP,
        status = CASE WHEN submissions.status = 'graded' THEN 'resubmitted' ELSE EXCLUDED.status END
      RETURNING *;
    `;

    const subRes = await client.query(upsertQuery, [
      assignment_id,
      student_id,
      file_url,
      content,
      submissionStatus
    ]);
    const submission = subRes.rows[0];

    // 4. Record Activity Completion in database (Idempotent: unique constraint ensures no duplicates)
    await client.query(
      `INSERT INTO activity_completions (student_id, course_id, activity_type, activity_id, completion_source)
       VALUES ($1, $2, 'assignment', $3, 'submission')
       ON CONFLICT (student_id, course_id, activity_type, activity_id) DO NOTHING`,
      [student_id, assignment.course_id, assignment_id]
    );

    // 5. Recalculate course progress
    const totalCountRes = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM course_materials cm JOIN modules m ON cm.module_id = m.id WHERE m.course_id = $1) +
        (SELECT COUNT(*) FROM assignments WHERE course_id = $1 AND status = 'published') AS total_required`,
      [assignment.course_id]
    );
    const totalRequired = parseInt(totalCountRes.rows[0]?.total_required || 0, 10);

    const completedCountRes = await client.query(
      `SELECT COUNT(*) AS total_completed 
       FROM activity_completions 
       WHERE student_id = $1 AND course_id = $2`,
      [student_id, assignment.course_id]
    );
    const totalCompleted = parseInt(completedCountRes.rows[0]?.total_completed || 0, 10);

    const progressPercentage = totalRequired > 0 
      ? Math.round((totalCompleted / totalRequired) * 100) 
      : 0;

    await client.query(
      `UPDATE enrollments 
       SET progress_percentage = $1,
           status = CASE WHEN $1 = 100 THEN 'completed' ELSE 'active' END
       WHERE student_id = $2 AND course_id = $3`,
      [progressPercentage, student_id, assignment.course_id]
    );

    // 6. Notify Instructor
    const studentRes = await client.query('SELECT name FROM users WHERE id = $1', [student_id]);
    const studentName = studentRes.rows[0]?.name || 'Student';

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'assignment', $4);`,
      [
        assignment.instructor_id,
        'New Assignment Submission',
        `${studentName} submitted "${assignment.title}" in ${assignment.course_title}.`,
        `/instructor/courses/${assignment.course_id}/assignments/${assignment_id}`
      ]
    );

    await client.query('COMMIT');
    return submission;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getSubmissionsByAssignment = async (assignmentId, instructorId = null) => {
  if (instructorId) {
    const check = await db.query(
      `SELECT c.instructor_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       WHERE a.id = $1`,
      [assignmentId]
    );
    if (check.rows.length === 0) {
      const err = new Error('Assignment not found.');
      err.statusCode = 404;
      throw err;
    }
  }

  const query = `
    SELECT 
      s.id, s.assignment_id, s.student_id, s.file_url, s.content, s.submitted_at,
      s.grade, s.feedback, s.graded_at, s.status,
      u.name AS student_name, u.email AS student_email, u.avatar_url AS student_avatar,
      g.name AS grader_name,
      a.max_points, a.title AS assignment_title, a.due_date, a.grades_released
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN users g ON s.graded_by = g.id
    WHERE s.assignment_id = $1
    ORDER BY s.submitted_at DESC;
  `;
  const result = await db.query(query, [assignmentId]);
  return result.rows;
};

const getStudentSubmission = async (assignmentId, studentId) => {
  const query = `
    SELECT 
      s.id, s.assignment_id, s.student_id, s.file_url, s.content, s.submitted_at, s.status,
      a.title AS assignment_title, a.max_points, a.due_date, a.grades_released,
      CASE WHEN a.grades_released = TRUE THEN s.grade ELSE NULL END AS grade,
      CASE WHEN a.grades_released = TRUE THEN s.feedback ELSE NULL END AS feedback,
      CASE WHEN a.grades_released = TRUE THEN s.graded_at ELSE NULL END AS graded_at,
      CASE WHEN a.grades_released = TRUE THEN u.name ELSE NULL END AS grader_name
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN users u ON s.graded_by = u.id
    WHERE s.assignment_id = $1 AND s.student_id = $2;
  `;
  const result = await db.query(query, [assignmentId, studentId]);
  return result.rows[0] || null;
};

const gradeSubmission = async ({ submission_id, grade, feedback, graded_by }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch submission and assignment details
    const subRes = await client.query(
      `SELECT s.id, s.student_id, s.assignment_id, a.max_points, a.title AS assignment_title, a.course_id, a.grades_released
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1`,
      [submission_id]
    );

    if (subRes.rows.length === 0) {
      const err = new Error('Submission not found.');
      err.statusCode = 404;
      throw err;
    }

    const sub = subRes.rows[0];
    const numericGrade = parseFloat(grade);

    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > sub.max_points) {
      const err = new Error(`Grade must be a number between 0 and maximum points (${sub.max_points}).`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Update submission
    const updateQuery = `
      UPDATE submissions
      SET grade = $1,
          feedback = $2,
          graded_by = $3,
          graded_at = CURRENT_TIMESTAMP,
          status = 'graded'
      WHERE id = $4
      RETURNING *;
    `;
    const updatedRes = await client.query(updateQuery, [
      numericGrade,
      feedback ? feedback.trim() : null,
      graded_by,
      submission_id
    ]);
    const updatedSubmission = updatedRes.rows[0];

    // 3. Notify student only if grades are released
    if (sub.grades_released) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'grade', $4);`,
        [
          sub.student_id,
          `Grade Released: ${sub.assignment_title}`,
          `Your submission was evaluated. Grade: ${numericGrade}/${sub.max_points}.${feedback ? ` Feedback: "${feedback.substring(0, 80)}..."` : ''}`,
          `/student/assignments`
        ]
      );
    }

    await client.query('COMMIT');
    return updatedSubmission;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  submitAssignment,
  getSubmissionsByAssignment,
  getStudentSubmission,
  gradeSubmission
};

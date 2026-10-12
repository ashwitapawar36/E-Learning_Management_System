const db = require('../config/db');

const getInstructorDashboardStats = async (instructorId) => {
  // 1. Core aggregates
  const countsRes = await db.query(
    `SELECT 
      COUNT(DISTINCT c.id)::int AS total_courses,
      COUNT(DISTINCT e.id)::int AS total_enrollments,
      COUNT(DISTINCT e.student_id)::int AS unique_students,
      COUNT(DISTINCT a.id)::int AS total_assignments,
      COUNT(DISTINCT s.id)::int AS total_submissions,
      COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'resubmitted') THEN s.id END)::int AS pending_grading_count,
      COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END)::int AS graded_count
     FROM courses c
     LEFT JOIN enrollments e ON c.id = e.course_id
     LEFT JOIN assignments a ON c.id = a.course_id
     LEFT JOIN submissions s ON a.id = s.assignment_id
     WHERE c.instructor_id = $1`,
    [instructorId]
  );

  // 2. Recent Submissions that need grading
  const pendingSubmissionsRes = await db.query(
    `SELECT 
      s.id, s.assignment_id, s.student_id, s.submitted_at, s.status, s.file_url,
      u.name AS student_name, u.email AS student_email,
      a.title AS assignment_title, a.max_points,
      c.id AS course_id, c.title AS course_title
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c ON a.course_id = c.id
     JOIN users u ON s.student_id = u.id
     WHERE c.instructor_id = $1 AND s.status IN ('submitted', 'resubmitted')
     ORDER BY s.submitted_at ASC
     LIMIT 5`,
    [instructorId]
  );

  // 3. Courses Breakdown
  const coursesBreakdownRes = await db.query(
    `SELECT 
      c.id, c.title, c.category, c.status, c.created_at,
      COUNT(DISTINCT e.id)::int AS students_count,
      COUNT(DISTINCT a.id)::int AS assignments_count,
      COUNT(DISTINCT CASE WHEN s.status IN ('submitted', 'resubmitted') THEN s.id END)::int AS pending_evaluations
     FROM courses c
     LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
     LEFT JOIN assignments a ON c.id = a.course_id
     LEFT JOIN submissions s ON a.id = s.assignment_id
     WHERE c.instructor_id = $1
     GROUP BY c.id
     ORDER BY students_count DESC
     LIMIT 5`,
    [instructorId]
  );

  return {
    overview: countsRes.rows[0],
    pending_submissions: pendingSubmissionsRes.rows,
    recent_courses: coursesBreakdownRes.rows
  };
};

const getStudentDashboardStats = async (studentId) => {
  // 1. Core aggregates
  const countsRes = await db.query(
    `SELECT 
      COUNT(DISTINCT e.id)::int AS enrolled_courses_count,
      COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.id END)::int AS completed_courses_count,
      ROUND(AVG(e.progress_percentage)::numeric, 1) AS average_progress,
      COUNT(DISTINCT s.id)::int AS total_submissions_count,
      COUNT(DISTINCT CASE WHEN s.status = 'graded' AND a.grades_released = TRUE THEN s.id END)::int AS graded_submissions_count,
      ROUND(AVG(CASE WHEN a.grades_released = TRUE THEN s.grade ELSE NULL END)::numeric, 1) AS average_grade
     FROM enrollments e
     LEFT JOIN courses c ON e.course_id = c.id
     LEFT JOIN assignments a ON c.id = a.course_id
     LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
     WHERE e.student_id = $1 AND e.status = 'active'`,
    [studentId]
  );

  // 2. Upcoming assignment deadlines
  const upcomingAssignmentsRes = await db.query(
    `SELECT 
      a.id, a.course_id, a.title, a.due_date, a.max_points,
      c.title AS course_title,
      s.id AS submission_id, s.status AS submission_status
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     JOIN assignments a ON c.id = a.course_id
     LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
     WHERE e.student_id = $1 AND e.status = 'active' AND a.status = 'published' AND a.due_date > CURRENT_TIMESTAMP
     ORDER BY a.due_date ASC
     LIMIT 5`,
    [studentId]
  );

  // 3. Recent Grades (only released grades)
  const recentGradesRes = await db.query(
    `SELECT 
      s.id, s.grade, s.feedback, s.graded_at,
      a.title AS assignment_title, a.max_points,
      c.title AS course_title
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c ON a.course_id = c.id
     WHERE s.student_id = $1 AND s.status = 'graded' AND a.grades_released = TRUE
     ORDER BY s.graded_at DESC
     LIMIT 5`,
    [studentId]
  );

  return {
    overview: countsRes.rows[0],
    upcoming_assignments: upcomingAssignmentsRes.rows,
    recent_grades: recentGradesRes.rows
  };
};

module.exports = {
  getInstructorDashboardStats,
  getStudentDashboardStats
};

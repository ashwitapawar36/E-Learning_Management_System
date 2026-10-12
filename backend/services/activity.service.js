const db = require('../config/db');

/**
 * Calculates real database-backed course progress for a student
 * Formula: progress_percentage = (completed_activities / total_activities) * 100
 */
const getCourseProgress = async (courseId, studentId) => {
  // 1. Get all published learning materials in this course
  const materialsQuery = `
    SELECT 
      cm.id, cm.module_id, cm.title, cm.material_type, cm.file_url, cm.content, cm.order_index,
      m.title AS module_title
    FROM course_materials cm
    JOIN modules m ON cm.module_id = m.id
    WHERE m.course_id = $1
    ORDER BY m.order_index ASC, cm.order_index ASC, cm.id ASC
  `;
  const materialsRes = await db.query(materialsQuery, [courseId]);
  const materials = materialsRes.rows;

  // 2. Get all published assignments in this course
  const assignmentsQuery = `
    SELECT 
      a.id, a.module_id, a.title, a.description, a.due_date, a.max_points, a.attachment_url, a.grades_released,
      m.title AS module_title
    FROM assignments a
    LEFT JOIN modules m ON a.module_id = m.id
    WHERE a.course_id = $1 AND a.status = 'published'
    ORDER BY a.due_date ASC, a.id ASC
  `;
  const assignmentsRes = await db.query(assignmentsQuery, [courseId]);
  const assignments = assignmentsRes.rows;

  // 3. Get completed activities for this student in this course
  const completionsQuery = `
    SELECT activity_type, activity_id, completed_at, completion_source
    FROM activity_completions
    WHERE student_id = $1 AND course_id = $2
  `;
  const completionsRes = await db.query(completionsQuery, [studentId, courseId]);
  
  const completedMap = new Map();
  for (const c of completionsRes.rows) {
    completedMap.set(`${c.activity_type}_${c.activity_id}`, c.completed_at);
  }

  // 4. Assemble activity objects with completion flags
  const activitiesList = [
    ...materials.map(m => {
      const key = `material_${m.id}`;
      const isCompleted = completedMap.has(key);
      return {
        activity_type: 'material',
        activity_id: m.id,
        module_id: m.module_id,
        module_title: m.module_title,
        title: m.title,
        material_type: m.material_type,
        file_url: m.file_url,
        content: m.content,
        order_index: m.order_index,
        completed: isCompleted,
        completed_at: isCompleted ? completedMap.get(key) : null
      };
    }),
    ...assignments.map(a => {
      const key = `assignment_${a.id}`;
      const isCompleted = completedMap.has(key);
      return {
        activity_type: 'assignment',
        activity_id: a.id,
        module_id: a.module_id,
        module_title: a.module_title,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_points: a.max_points,
        grades_released: a.grades_released,
        completed: isCompleted,
        completed_at: isCompleted ? completedMap.get(key) : null
      };
    })
  ];

  const total_activities = activitiesList.length;
  const completed_activities = activitiesList.filter(a => a.completed).length;
  const progress_percentage = total_activities > 0 
    ? Math.round((completed_activities / total_activities) * 100) 
    : 0;

  // 5. Sync computed progress into enrollments table
  await db.query(
    `UPDATE enrollments 
     SET progress_percentage = $1,
         status = CASE WHEN $1 = 100 THEN 'completed' ELSE 'active' END
     WHERE student_id = $2 AND course_id = $3`,
    [progress_percentage, studentId, courseId]
  );

  return {
    course_id: parseInt(courseId, 10),
    student_id: parseInt(studentId, 10),
    completed_activities,
    total_activities,
    progress_percentage,
    activities: activitiesList
  };
};

/**
 * Securely accesses a learning resource and records student completion
 */
const accessMaterial = async (materialId, userId, userRole = 'student') => {
  // 1. Fetch material, module and course
  const matQuery = `
    SELECT 
      cm.id, cm.module_id, cm.title, cm.material_type, cm.file_url, cm.content,
      m.course_id, c.title AS course_title, c.instructor_id
    FROM course_materials cm
    JOIN modules m ON cm.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE cm.id = $1
  `;
  const matRes = await db.query(matQuery, [materialId]);
  if (matRes.rows.length === 0) {
    const error = new Error('Course resource not found.');
    error.statusCode = 404;
    throw error;
  }
  const material = matRes.rows[0];

  // 2. Instructor of this course or admin can access directly
  if (userRole === 'admin' || (userRole === 'instructor' && material.instructor_id === userId)) {
    return {
      material,
      progress: null
    };
  }

  // 3. For students: check if actively enrolled in course
  const enrollRes = await db.query(
    `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status IN ('active', 'completed')`,
    [userId, material.course_id]
  );
  if (enrollRes.rows.length === 0) {
    const error = new Error('You must be actively enrolled in this course to access this learning resource.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Record completion idempotently
  await db.query(
    `INSERT INTO activity_completions (student_id, course_id, activity_type, activity_id, completion_source)
     VALUES ($1, $2, 'material', $3, 'view')
     ON CONFLICT (student_id, course_id, activity_type, activity_id) DO NOTHING`,
    [userId, material.course_id, material.id]
  );

  // 5. Recalculate progress
  const progress = await getCourseProgress(material.course_id, userId);

  return {
    material,
    progress
  };
};

/**
 * Records completion of an assignment upon valid submission
 */
const recordAssignmentSubmissionCompletion = async (assignmentId, studentId, courseId) => {
  await db.query(
    `INSERT INTO activity_completions (student_id, course_id, activity_type, activity_id, completion_source)
     VALUES ($1, $2, 'assignment', $3, 'submission')
     ON CONFLICT (student_id, course_id, activity_type, activity_id) DO NOTHING`,
    [studentId, courseId, assignmentId]
  );

  return await getCourseProgress(courseId, studentId);
};

module.exports = {
  getCourseProgress,
  accessMaterial,
  recordAssignmentSubmissionCompletion
};

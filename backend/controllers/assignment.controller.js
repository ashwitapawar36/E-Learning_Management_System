const assignmentService = require('../services/assignment.service');

const getAssignmentsByCourse = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const studentId = req.user && req.user.role === 'student' ? req.user.id : null;
    const assignments = await assignmentService.getAssignmentsByCourse(courseId, studentId);
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const userId = req.user ? req.user.id : null;
    const role = req.user ? req.user.role : null;
    const assignment = await assignmentService.getAssignmentById(assignmentId, userId, role);
    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const { module_id, title, description, due_date, max_points, status } = req.body;
    let attachment_url = req.body.attachment_url || null;

    if (req.file) {
      attachment_url = `/uploads/materials/${req.file.filename}`;
    }

    if (!title || !description || !due_date) {
      return res.status(400).json({ success: false, message: 'Title, description, and due date are required.' });
    }

    const assignment = await assignmentService.createAssignment({
      course_id: courseId,
      module_id: module_id ? parseInt(module_id, 10) : null,
      title,
      description,
      due_date,
      max_points: parseInt(max_points, 10) || 100,
      attachment_url,
      status: status || 'published'
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const { module_id, title, description, due_date, max_points, status, grades_released } = req.body;
    let attachment_url = req.body.attachment_url;

    if (req.file) {
      attachment_url = `/uploads/materials/${req.file.filename}`;
    }

    const updated = await assignmentService.updateAssignment(assignmentId, {
      module_id: module_id ? parseInt(module_id, 10) : null,
      title,
      description,
      due_date,
      max_points: max_points ? parseInt(max_points, 10) : undefined,
      attachment_url,
      status,
      grades_released
    });

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const toggleGradeRelease = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const { grades_released } = req.body;
    const updated = await assignmentService.toggleGradeRelease(assignmentId, grades_released);
    res.status(200).json({
      success: true,
      message: `Grades ${updated.grades_released ? 'released to students' : 'hidden from students'}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const result = await assignmentService.deleteAssignment(assignmentId);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const getStudentAllAssignments = async (req, res, next) => {
  try {
    const assignments = await assignmentService.getStudentAllAssignments(req.user.id);
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
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


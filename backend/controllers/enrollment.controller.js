const enrollmentService = require('../services/enrollment.service');

const enroll = async (req, res, next) => {
  try {
    const courseId = parseInt(req.body.course_id || req.body.courseId || req.params.courseId, 10);
    const enrollmentKey = req.body.enrollmentKey !== undefined 
      ? req.body.enrollmentKey 
      : (req.body.enrollment_key !== undefined ? req.body.enrollment_key : null);
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Valid Course ID is required.' });
    }
    const enrollment = await enrollmentService.enrollStudent(req.user.id, courseId, enrollmentKey);
    res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully.',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

const dropEnrollment = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const result = await enrollmentService.dropEnrollment(req.user.id, courseId);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getStudentEnrollments(req.user.id);
    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

const getCourseEnrollments = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const students = await enrollmentService.getCourseEnrollments(courseId, req.user.id);
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    // Automatic recalculation: ignores arbitrary body percentages
    const progress = await enrollmentService.recalculateProgress(req.user.id, courseId);
    res.status(200).json({
      success: true,
      message: 'Course progress calculated from activity completions.',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enroll,
  dropEnrollment,
  getMyEnrollments,
  getCourseEnrollments,
  updateProgress
};

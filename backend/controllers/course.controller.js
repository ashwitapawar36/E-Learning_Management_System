const courseService = require('../services/course.service');
const activityService = require('../services/activity.service');

const getAllCourses = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const studentId = req.user ? req.user.id : null;
    const courses = await courseService.getAllCourses({ search, category, status, studentId });
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const course = await courseService.getCourseById(courseId, req.user);
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getInstructorCourses(req.user.id);
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      category, 
      status, 
      max_capacity, 
      enrollment_deadline,
      requires_enrollment_key,
      requiresEnrollmentKey,
      enrollment_key,
      enrollmentKey
    } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Course title is required.' });
    }

    let thumbnail_url = req.body.thumbnail_url || null;
    if (req.file) {
      thumbnail_url = `/uploads/thumbnails/${req.file.filename}`;
    }

    const course = await courseService.createCourse({
      title,
      description,
      instructor_id: req.user.id,
      category,
      thumbnail_url,
      status,
      max_capacity,
      enrollment_deadline,
      requires_enrollment_key: requires_enrollment_key !== undefined ? requires_enrollment_key : requiresEnrollmentKey,
      enrollment_key: enrollment_key || enrollmentKey
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const { 
      title, 
      description, 
      category, 
      status, 
      max_capacity, 
      enrollment_deadline,
      requires_enrollment_key,
      requiresEnrollmentKey,
      enrollment_key,
      enrollmentKey 
    } = req.body;
    let thumbnail_url = req.body.thumbnail_url;
    if (req.file) {
      thumbnail_url = `/uploads/thumbnails/${req.file.filename}`;
    }

    const course = await courseService.updateCourse(courseId, req.user.id, {
      title,
      description,
      category,
      thumbnail_url,
      status,
      max_capacity,
      enrollment_deadline,
      requires_enrollment_key: requires_enrollment_key !== undefined ? requires_enrollment_key : requiresEnrollmentKey,
      enrollment_key: enrollment_key || enrollmentKey
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const updateEnrollmentSettings = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const requires_enrollment_key = req.body.requires_enrollment_key !== undefined 
      ? req.body.requires_enrollment_key 
      : req.body.requiresEnrollmentKey;
    const enrollment_key = req.body.enrollment_key !== undefined 
      ? req.body.enrollment_key 
      : req.body.enrollmentKey;

    const result = await courseService.updateEnrollmentSettings(courseId, req.user.id, {
      requires_enrollment_key,
      enrollment_key
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment settings updated successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const result = await courseService.deleteCourse(courseId, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const getCourseProgress = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    let targetStudentId = req.user.id;
    if ((req.user.role === 'instructor' || req.user.role === 'admin') && req.query.student_id) {
      targetStudentId = parseInt(req.query.student_id, 10);
    }
    const progress = await activityService.getCourseProgress(courseId, targetStudentId);
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

const getCourseEnrollmentKey = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const keyData = await courseService.getCourseEnrollmentKey(courseId, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      data: keyData
    });
  } catch (error) {
    next(error);
  }
};

const regenerateCourseEnrollmentKey = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const keyData = await courseService.regenerateCourseEnrollmentKey(courseId, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Enrollment key regenerated successfully.',
      data: keyData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getInstructorCourses,
  createCourse,
  updateCourse,
  updateEnrollmentSettings,
  deleteCourse,
  getCourseProgress,
  getCourseEnrollmentKey,
  regenerateCourseEnrollmentKey
};


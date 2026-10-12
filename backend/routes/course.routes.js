const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

// Public / student course browsing
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/instructor', authenticate, authorize('instructor', 'admin'), courseController.getInstructorCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);
router.get('/:id/progress', authenticate, courseController.getCourseProgress);

// Instructor Course Management
router.post('/', authenticate, authorize('instructor', 'admin'), upload.single('thumbnail'), courseController.createCourse);
router.put('/:id', authenticate, authorize('instructor', 'admin'), upload.single('thumbnail'), courseController.updateCourse);
router.put('/:id/enrollment-settings', authenticate, authorize('instructor', 'admin'), courseController.updateEnrollmentSettings);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), courseController.deleteCourse);

module.exports = router;

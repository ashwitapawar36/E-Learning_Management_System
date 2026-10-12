const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Student enrollment actions
router.post('/enroll', authenticate, authorize('student', 'admin'), enrollmentController.enroll);
router.post('/courses/:courseId/enroll', authenticate, authorize('student', 'admin'), enrollmentController.enroll);
router.post('/courses/:courseId/drop', authenticate, authorize('student', 'admin'), enrollmentController.dropEnrollment);
router.get('/my', authenticate, authorize('student', 'admin'), enrollmentController.getMyEnrollments);
router.put('/courses/:courseId/progress', authenticate, authorize('student', 'admin'), enrollmentController.updateProgress);

// Instructor view of enrolled students
router.get('/courses/:courseId/students', authenticate, authorize('instructor', 'admin'), enrollmentController.getCourseEnrollments);

module.exports = router;

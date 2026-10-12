const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

// Student all assignments overview
router.get('/my', authenticate, authorize('student', 'admin'), assignmentController.getStudentAllAssignments);

// Course assignments
router.get('/courses/:courseId/assignments', optionalAuth, assignmentController.getAssignmentsByCourse);
router.get('/:id', optionalAuth, assignmentController.getAssignmentById);

// Instructor assignment creation and management
router.post('/courses/:courseId/assignments', authenticate, authorize('instructor', 'admin'), upload.single('attachment'), assignmentController.createAssignment);
router.put('/:id', authenticate, authorize('instructor', 'admin'), upload.single('attachment'), assignmentController.updateAssignment);
router.put('/:id/release-grades', authenticate, authorize('instructor', 'admin'), assignmentController.toggleGradeRelease);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), assignmentController.deleteAssignment);

module.exports = router;

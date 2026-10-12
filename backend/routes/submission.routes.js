const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

// Student submits an assignment (file upload and/or text)
router.post('/assignments/:assignmentId', authenticate, authorize('student', 'admin'), upload.single('submission_file'), submissionController.submit);
router.get('/assignments/:assignmentId/my', authenticate, authorize('student', 'admin'), submissionController.getMySubmission);

// Instructor views submissions for an assignment
router.get('/assignments/:assignmentId', authenticate, authorize('instructor', 'admin'), submissionController.getSubmissionsByAssignment);

// Instructor grades a submission
router.put('/:id/grade', authenticate, authorize('instructor', 'admin'), submissionController.grade);

module.exports = router;

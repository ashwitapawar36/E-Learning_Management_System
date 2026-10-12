const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/instructor', authenticate, authorize('instructor', 'admin'), analyticsController.getInstructorDashboard);
router.get('/student', authenticate, authorize('student', 'admin'), analyticsController.getStudentDashboard);

module.exports = router;

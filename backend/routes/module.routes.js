const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/module.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/courses/:courseId/modules', moduleController.getModulesByCourse);
router.post('/courses/:courseId/modules', authenticate, authorize('instructor', 'admin'), moduleController.createModule);
router.put('/:id', authenticate, authorize('instructor', 'admin'), moduleController.updateModule);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), moduleController.deleteModule);

module.exports = router;

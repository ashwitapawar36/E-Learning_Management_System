const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/modules/:moduleId/materials', materialController.getMaterialsByModule);
router.get('/:id/access', authenticate, materialController.accessMaterial);
router.post('/modules/:moduleId/materials', authenticate, authorize('instructor', 'admin'), upload.single('file'), materialController.createMaterial);
router.put('/:id', authenticate, authorize('instructor', 'admin'), upload.single('file'), materialController.updateMaterial);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), materialController.deleteMaterial);

module.exports = router;

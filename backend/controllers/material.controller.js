const path = require('path');
const materialService = require('../services/material.service');
const activityService = require('../services/activity.service');

const getMaterialsByModule = async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.moduleId, 10);
    const materials = await materialService.getMaterialsByModule(moduleId);
    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    next(error);
  }
};

const accessMaterial = async (req, res, next) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await activityService.accessMaterial(materialId, userId, userRole);

    if (req.query.download === 'true' && result.material.file_url) {
      const filePath = path.join(__dirname, '..', result.material.file_url);
      return res.download(filePath);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.moduleId, 10);
    const { title, material_type, content, order_index } = req.body;
    let file_url = req.body.file_url || null;

    if (req.file) {
      file_url = `/uploads/materials/${req.file.filename}`;
    }

    if (!title || !material_type) {
      return res.status(400).json({ success: false, message: 'Title and material_type are required.' });
    }

    const material = await materialService.createMaterial({
      module_id: moduleId,
      title,
      material_type,
      file_url,
      content,
      order_index: parseInt(order_index, 10) || 1
    });

    res.status(201).json({
      success: true,
      message: 'Course material added successfully.',
      data: material
    });
  } catch (error) {
    next(error);
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const { title, material_type, content, order_index } = req.body;
    let file_url = req.body.file_url;

    if (req.file) {
      file_url = `/uploads/materials/${req.file.filename}`;
    }

    const updated = await materialService.updateMaterial(materialId, {
      title,
      material_type,
      file_url,
      content,
      order_index
    });

    res.status(200).json({
      success: true,
      message: 'Material updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const result = await materialService.deleteMaterial(materialId);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterialsByModule,
  accessMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial
};


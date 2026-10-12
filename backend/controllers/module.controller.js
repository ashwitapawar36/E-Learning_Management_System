const moduleService = require('../services/module.service');

const getModulesByCourse = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const modules = await moduleService.getModulesByCourse(courseId);
    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

const createModule = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const { title, description, order_index } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Module title is required.' });
    }
    const moduleItem = await moduleService.createModule({
      course_id: courseId,
      title,
      description,
      order_index
    });
    res.status(201).json({
      success: true,
      message: 'Module created successfully.',
      data: moduleItem
    });
  } catch (error) {
    next(error);
  }
};

const updateModule = async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    const { title, description, order_index } = req.body;
    const updated = await moduleService.updateModule(moduleId, { title, description, order_index });
    res.status(200).json({
      success: true,
      message: 'Module updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteModule = async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    const result = await moduleService.deleteModule(moduleId);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule
};

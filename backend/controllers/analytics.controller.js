const analyticsService = require('../services/analytics.service');

const getInstructorDashboard = async (req, res, next) => {
  try {
    const stats = await analyticsService.getInstructorDashboardStats(req.user.id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

const getStudentDashboard = async (req, res, next) => {
  try {
    const stats = await analyticsService.getStudentDashboardStats(req.user.id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInstructorDashboard,
  getStudentDashboard
};

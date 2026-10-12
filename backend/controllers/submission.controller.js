const submissionService = require('../services/submission.service');

const submit = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId || req.body.assignment_id, 10);
    const { content } = req.body;
    let file_url = req.body.file_url || null;

    if (req.file) {
      file_url = `/uploads/submissions/${req.file.filename}`;
    }

    if (!file_url && !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a submission file or text response.'
      });
    }

    const submission = await submissionService.submitAssignment({
      assignment_id: assignmentId,
      student_id: req.user.id,
      file_url,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully!',
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

const getSubmissionsByAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const submissions = await submissionService.getSubmissionsByAssignment(assignmentId, req.user.role === 'instructor' ? req.user.id : null);
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

const getMySubmission = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const submission = await submissionService.getStudentSubmission(assignmentId, req.user.id);
    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

const grade = async (req, res, next) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ success: false, message: 'Grade is required.' });
    }

    const updated = await submissionService.gradeSubmission({
      submission_id: submissionId,
      grade,
      feedback,
      graded_by: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submit,
  getSubmissionsByAssignment,
  getMySubmission,
  grade
};

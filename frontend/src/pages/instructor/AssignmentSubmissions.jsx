import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  Download, 
  Clock, 
  CheckCircle, 
  Users, 
  FileText,
  MessageSquare
} from 'lucide-react';
import { assignmentsAPI, submissionsAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import GradingModal from '../../components/assignments/GradingModal';

const AssignmentSubmissions = () => {
  const { courseId, assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, subRes] = await Promise.all([
        assignmentsAPI.getById(assignmentId),
        submissionsAPI.getByAssignment(assignmentId)
      ]);
      if (assignRes.data.success) {
        setAssignment(assignRes.data.data);
      }
      if (subRes.data.success) {
        setSubmissions(subRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const handleGradeSubmit = async (submissionId, gradeData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.grade(submissionId, gradeData);
      setActiveSubmission(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating grade.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading assignment submissions..." />;
  }

  if (!assignment) {
    return <div className="text-center py-12 text-slate-500">Assignment not found.</div>;
  }

  const dueDate = new Date(assignment.due_date);
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = submissions.length - gradedCount;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/instructor/courses/${courseId}?tab=assignments`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Course Assignments
        </Link>
      </div>

      {/* Assignment Header Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {assignment.course_title}
            </span>
            <span className="text-slate-300">•</span>
            <Badge variant="brand">{assignment.max_points} Points Max</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 heading-font">
            {assignment.title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl">
            {assignment.description}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Deadline: <strong>{dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
            {assignment.attachment_url && (
              <a
                href={assignment.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Assignment Handout File
              </a>
            )}
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex sm:flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-shrink-0 text-center sm:text-left">
          <div>
            <span className="text-xs text-slate-400">Total Turned In</span>
            <div className="text-xl font-bold text-slate-900">{submissions.length}</div>
          </div>
          <div className="border-t border-slate-200 pt-2 flex gap-4 text-xs">
            <div>
              <span className="text-emerald-600 font-bold">{gradedCount}</span> Graded
            </div>
            <div>
              <span className="text-amber-600 font-bold">{pendingCount}</span> Pending
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table / Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 heading-font mb-4">
          Student Submissions ({submissions.length})
        </h2>

        {submissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No submissions received yet"
            description="Students will submit their work here as they complete the assignment before or after the deadline."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Submitted At</th>
                    <th className="px-6 py-4">Attached Deliverable</th>
                    <th className="px-6 py-4">Status & Score</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {submissions.map((sub) => {
                    const isGraded = sub.status === 'graded';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Student details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                              {sub.student_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{sub.student_name}</div>
                              <div className="text-slate-400 text-[11px]">{sub.student_email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          <div>{new Date(sub.submitted_at).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Deliverables */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {sub.file_url ? (
                              <a
                                href={sub.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span>Download File</span>
                              </a>
                            ) : null}

                            {sub.content && (
                              <div className="text-[11px] text-slate-600 max-w-xs truncate italic">
                                "{sub.content}"
                              </div>
                            )}

                            {!sub.file_url && !sub.content && (
                              <span className="text-slate-400">No deliverable</span>
                            )}
                          </div>
                        </td>

                        {/* Status & Grade */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isGraded ? (
                            <div>
                              <span className="text-sm font-extrabold text-emerald-600">
                                {sub.grade} / {assignment.max_points}
                              </span>
                              {sub.feedback && (
                                <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-slate-400" />
                                  <span>{sub.feedback}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant={sub.status === 'late' ? 'warning' : 'brand'}>
                              {sub.status === 'late' ? 'Late - Needs Grade' : 'Submitted - Needs Grade'}
                            </Badge>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            size="sm"
                            variant={isGraded ? 'secondary' : 'primary'}
                            onClick={() => setActiveSubmission(sub)}
                            icon={Award}
                          >
                            {isGraded ? 'Edit Grade' : 'Grade Submission'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {activeSubmission && (
        <GradingModal
          isOpen={!!activeSubmission}
          onClose={() => setActiveSubmission(null)}
          onSubmit={handleGradeSubmit}
          submission={activeSubmission}
          maxPoints={assignment.max_points}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default AssignmentSubmissions;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  FileCheck, 
  Clock, 
  Plus, 
  CheckCircle, 
  ArrowRight, 
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { analyticsAPI, submissionsAPI, coursesAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import CourseFormModal from '../../components/courses/CourseFormModal';
import GradingModal from '../../components/assignments/GradingModal';

const InstructorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getInstructorDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError('Failed to load instructor dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateCourse = async (formData) => {
    try {
      setActionLoading(true);
      await coursesAPI.create(formData);
      setIsCourseModalOpen(false);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating course.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, gradeData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.grade(submissionId, gradeData);
      setGradingSubmission(null);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Error grading submission.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading instructor metrics..." />;
  }

  if (error || !data) {
    return <div className="text-center py-12 text-rose-500 font-semibold">{error}</div>;
  }

  const { overview, pending_submissions, recent_courses } = data;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div>
          <span className="text-xs font-bold text-brand-300 uppercase tracking-widest">
            Instructor Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 heading-font">
            Academic Course Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Monitor course curriculum, track student progress, and grade incoming assignments backed by PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCourseModalOpen(true)}
            icon={Plus}
            className="shadow-lg shadow-brand-500/25"
          >
            Create New Course
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Courses"
          value={overview.total_courses || 0}
          icon={BookOpen}
          color="brand"
          subtitle="Curriculums managed"
        />
        <StatCard
          title="Enrolled Students"
          value={overview.unique_students || 0}
          icon={Users}
          color="emerald"
          subtitle={`${overview.total_enrollments || 0} active enrollments`}
        />
        <StatCard
          title="Pending Grading"
          value={overview.pending_grading_count || 0}
          icon={Clock}
          color="amber"
          subtitle="Submissions waiting for score"
        />
        <StatCard
          title="Graded Submissions"
          value={overview.graded_count || 0}
          icon={CheckCircle}
          color="purple"
          subtitle="Evaluations completed"
        />
      </div>

      {/* Main Grid: Pending Grading & Courses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Submissions to Grade */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 heading-font flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Submissions Awaiting Grading
            </h2>
            <Badge variant="warning">{pending_submissions.length} Pending</Badge>
          </div>

          {pending_submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">All caught up!</h4>
              <p className="text-xs text-slate-500 mt-1">
                There are no pending student submissions waiting for evaluation at this moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending_submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 truncate">
                        {sub.course_title}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-800">
                        {sub.assignment_title}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {sub.student_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {sub.student_name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Submitted on {new Date(sub.submitted_at).toLocaleDateString()} at {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setGradingSubmission(sub)}
                      icon={Award}
                    >
                      Grade Now ({sub.max_points} pts)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Course Roster Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 heading-font flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              Active Courses
            </h2>
            <Link to="/instructor/courses" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {recent_courses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No courses created yet.
              </div>
            ) : (
              recent_courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/instructor/courses/${course.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                      {course.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{course.students_count} students</span>
                      <span>•</span>
                      <span>{course.assignments_count} assignments</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Course */}
      <CourseFormModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSubmit={handleCreateCourse}
        loading={actionLoading}
      />

      {/* Modal: Grade Submission */}
      {gradingSubmission && (
        <GradingModal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          onSubmit={handleGradeSubmission}
          submission={gradingSubmission}
          maxPoints={gradingSubmission.max_points}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;

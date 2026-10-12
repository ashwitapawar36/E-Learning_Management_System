import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  FileText,
  TrendingUp,
  FolderGit2
} from 'lucide-react';
import { analyticsAPI, enrollmentsAPI, submissionsAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SubmissionModal from '../../components/assignments/SubmissionModal';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, enrollRes] = await Promise.all([
        analyticsAPI.getStudentDashboard(),
        enrollmentsAPI.getMy()
      ]);
      if (analyticsRes.data.success) {
        setData(analyticsRes.data.data);
      }
      if (enrollRes.data.success) {
        setEnrolledCourses(enrollRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitAssignment = async (assignmentId, formData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.submit(assignmentId, formData);
      setSubmittingAssignment(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading student learning progress..." />;
  }

  if (!data) {
    return <div className="text-center py-12 text-slate-500">Failed to load student dashboard.</div>;
  }

  const { overview, upcoming_assignments, recent_grades } = data;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-brand-300 uppercase tracking-widest">
            Student Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 heading-font">
            Welcome to Your Learning Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Access course syllabi, submit laboratory assignments, and review grades and instructor feedback.
          </p>
        </div>
        <Link to="/courses">
          <Button variant="primary" icon={FolderGit2} className="shadow-lg shadow-brand-500/25">
            Browse Course Catalog
          </Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Enrolled Courses"
          value={overview.enrolled_courses_count || 0}
          icon={BookOpen}
          color="brand"
          subtitle="Active learning paths"
        />
        <StatCard
          title="Average Progress"
          value={`${overview.average_progress || 0}%`}
          icon={TrendingUp}
          color="emerald"
          subtitle="Curriculum completion"
        />
        <StatCard
          title="Submitted Tasks"
          value={overview.total_submissions_count || 0}
          icon={FileText}
          color="purple"
          subtitle="Completed coursework"
        />
        <StatCard
          title="Average Grade"
          value={overview.average_grade ? `${overview.average_grade} pts` : '—'}
          icon={Award}
          color="amber"
          subtitle="Evaluated assignments"
        />
      </div>

      {/* Main Grid: Continue Learning & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 heading-font flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" />
              Continue Learning
            </h2>
            <Link to="/courses" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Browse More Courses
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">You are not enrolled in any courses yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore our catalog to find engineering, web development, and database courses.
              </p>
              <div className="mt-4">
                <Link to="/courses">
                  <Button size="sm">Explore Catalog</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledCourses.map((c) => (
                <div
                  key={c.course_id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="brand" size="sm">{c.category}</Badge>
                      <span className="text-xs text-slate-400">By {c.instructor_name}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 heading-font truncate">
                      {c.course_title}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-3 max-w-md">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Course Completion</span>
                        <span className="font-bold text-slate-700">{c.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${c.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Link to={`/student/courses/${c.course_id}`}>
                      <Button size="sm" variant="primary" icon={ArrowRight}>
                        Go to Classroom
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Upcoming Deadlines & Recent Grades */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 heading-font flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Upcoming Deadlines
              </h2>
              <Link to="/student/assignments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                All
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {upcoming_assignments.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">
                  No upcoming deadlines! Great job.
                </div>
              ) : (
                upcoming_assignments.map((a) => {
                  const due = new Date(a.due_date);
                  return (
                    <div key={a.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{a.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{a.course_title}</p>
                        <p className="text-[10px] text-amber-600 font-semibold mt-1">
                          Due: {due.toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={a.submission_id ? 'secondary' : 'primary'}
                        onClick={() => setSubmittingAssignment(a)}
                      >
                        {a.submission_id ? 'Resubmit' : 'Turn In'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Grades */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 heading-font flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                Recent Grades
              </h2>
              <Link to="/student/grades" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Gradebook
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {recent_grades.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">
                  No graded tasks yet.
                </div>
              ) : (
                recent_grades.map((g) => (
                  <div key={g.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{g.assignment_title}</h4>
                        <p className="text-[11px] text-slate-400">{g.course_title}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-600">
                          {g.grade} / {g.max_points}
                        </span>
                      </div>
                    </div>
                    {g.feedback && (
                      <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg italic">
                        "{g.feedback}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {submittingAssignment && (
        <SubmissionModal
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmit={handleSubmitAssignment}
          assignment={submittingAssignment}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default StudentDashboard;

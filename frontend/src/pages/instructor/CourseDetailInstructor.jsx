import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Users, 
  Settings, 
  Layers, 
  Award, 
  ArrowLeft,
  Calendar,
  Download,
  CheckCircle2,
  Trash2,
  Edit,
  Key,
  Lock
} from 'lucide-react';
import { 
  coursesAPI, 
  modulesAPI, 
  materialsAPI, 
  assignmentsAPI, 
  enrollmentsAPI 
} from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ModuleAccordion from '../../components/courses/ModuleAccordion';
import MaterialModal from '../../components/courses/MaterialModal';
import AssignmentFormModal from '../../components/assignments/AssignmentFormModal';
import EnrollmentSettingsModal from '../../components/courses/EnrollmentSettingsModal';
import Modal from '../../components/common/Modal';

const CourseDetailInstructor = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'syllabus';

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isEnrollmentSettingsOpen, setIsEnrollmentSettingsOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  
  const [targetModuleForMaterial, setTargetModuleForMaterial] = useState(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await coursesAPI.getById(id);
      if (res.data.success) {
        setCourse(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await enrollmentsAPI.getStudents(id);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student roster:', err);
    }
  };

  useEffect(() => {
    fetchCourseData();
    fetchStudents();
  }, [id]);

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Add Module
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      setActionLoading(true);
      await modulesAPI.create(id, {
        title: moduleTitle,
        description: moduleDesc,
        order_index: (course?.modules?.length || 0) + 1
      });
      setIsModuleModalOpen(false);
      setModuleTitle('');
      setModuleDesc('');
      fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating module.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module and all its materials?')) return;
    try {
      await modulesAPI.delete(moduleId);
      fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting module.');
    }
  };

  // Add Material
  const handleAddMaterial = async (moduleId, formData) => {
    try {
      setActionLoading(true);
      await materialsAPI.create(moduleId, formData);
      setTargetModuleForMaterial(null);
      fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding material.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this course material?')) return;
    try {
      await materialsAPI.delete(materialId);
      fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting material.');
    }
  };

  // Add Assignment
  const handleCreateAssignment = async (formData) => {
    try {
      setActionLoading(true);
      await assignmentsAPI.create(id, formData);
      setIsAssignmentModalOpen(false);
      fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleGradeRelease = async (assignmentId, newStatus) => {
    try {
      await assignmentsAPI.toggleGradeRelease(assignmentId, newStatus);
      fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating grade release status.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading course curriculum & assignments..." />;
  }

  if (!course) {
    return <div className="text-center py-12 text-slate-500">Course not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top back link */}
      <div className="flex items-center gap-2">
        <Link
          to="/instructor/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Courses
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="brand">{course.category}</Badge>
            <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
              {course.status.toUpperCase()}
            </Badge>
            {course.requires_enrollment_key && (
              <Badge variant="warning">
                <Lock className="w-3 h-3 mr-1 inline" /> Key Required
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 heading-font">
            {course.title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            {course.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEnrollmentSettingsOpen(true)}
            icon={Key}
          >
            Enrollment Settings
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsModuleModalOpen(true)}
            icon={Plus}
          >
            Add Module
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAssignmentModalOpen(true)}
            icon={Plus}
          >
            New Assignment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'syllabus', label: `Syllabus & Materials (${course.modules?.length || 0})`, icon: Layers },
            { id: 'assignments', label: `Assignments (${course.assignments?.length || 0})`, icon: FileText },
            { id: 'students', label: `Enrolled Students (${students.length})`, icon: Users },
          ].map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => handleTabChange(tabId)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tabId
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Syllabus & Materials */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 heading-font">
                Course Syllabus Modules
              </h3>
              <p className="text-xs text-slate-500">
                Organize units, lecture notes, video recordings, and lab sheets.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsModuleModalOpen(true)}
              icon={Plus}
            >
              Add Module
            </Button>
          </div>

          <ModuleAccordion
            modules={course.modules || []}
            isInstructor={true}
            onAddModule={() => setIsModuleModalOpen(true)}
            onAddMaterial={(mod) => setTargetModuleForMaterial(mod)}
            onDeleteModule={handleDeleteModule}
            onDeleteMaterial={handleDeleteMaterial}
          />
        </div>
      )}

      {/* Tab 2: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 heading-font">
                Course Assignments & Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Create graded assessments, set due dates, and evaluate student submissions.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAssignmentModalOpen(true)}
              icon={Plus}
            >
              Create Assignment
            </Button>
          </div>

          {(!course.assignments || course.assignments.length === 0) ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No assignments created yet</p>
              <p className="text-xs text-slate-400 mt-1">Publish an assignment with deadline and score criteria.</p>
              <div className="mt-4">
                <Button size="sm" onClick={() => setIsAssignmentModalOpen(true)} icon={Plus}>
                  Create First Assignment
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.assignments.map((assignment) => {
                const dueDate = new Date(assignment.due_date);
                return (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="brand">{assignment.max_points} Points</Badge>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            assignment.grades_released 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {assignment.grades_released ? 'Grades Released' : 'Grades Hidden'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {dueDate.toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 heading-font">
                        {assignment.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-600 font-semibold">
                        {assignment.submissions_count || 0} student submissions
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleGradeRelease(assignment.id, !assignment.grades_released)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                            assignment.grades_released 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {assignment.grades_released ? 'Hide Grades' : 'Release Grades'}
                        </button>
                        <Link to={`/instructor/courses/${id}/assignments/${assignment.id}`}>
                          <Button size="sm" variant="secondary">
                            Review Submissions
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Enrolled Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 heading-font">
              Student Enrollment Roster ({students.length})
            </h3>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No students enrolled yet</p>
              <p className="text-xs text-slate-400 mt-1">Students will appear here once they enroll from the course catalog.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Enrolled Date</th>
                      <th className="px-6 py-3.5">Completed Activities</th>
                      <th className="px-6 py-3.5">Submissions</th>
                      <th className="px-6 py-3.5">Average Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {students.map((st) => (
                      <tr key={st.enrollment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center">
                              {st.student_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{st.student_name}</div>
                              <div className="text-slate-400 text-[11px]">{st.student_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {new Date(st.enrolled_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-brand-600 h-2 rounded-full"
                                style={{ width: `${st.progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">
                              {st.completed_activities_count || 0}/{st.total_activities_count || 0} ({st.progress_percentage || 0}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">
                          {st.total_submissions || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                          {st.average_grade ? `${st.average_grade} pts` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Modal: Add Module */}
      <Modal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title="Add Course Module"
      >
        <form onSubmit={handleCreateModule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Module Title *
            </label>
            <input
              type="text"
              required
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g. Module 3: Enterprise Architecture & REST API Design"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Module Description / Learning Objectives
            </label>
            <textarea
              rows="3"
              value={moduleDesc}
              onChange={(e) => setModuleDesc(e.target.value)}
              placeholder="Outline the topics covered in this module..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Add Module
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Material */}
      {targetModuleForMaterial && (
        <MaterialModal
          isOpen={!!targetModuleForMaterial}
          onClose={() => setTargetModuleForMaterial(null)}
          onSubmit={handleAddMaterial}
          targetModule={targetModuleForMaterial}
          loading={actionLoading}
        />
      )}

      {/* Modal: Create Assignment */}
      <AssignmentFormModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSubmit={handleCreateAssignment}
        modules={course.modules || []}
        loading={actionLoading}
      />

      {/* Modal: Enrollment Settings */}
      <EnrollmentSettingsModal
        isOpen={isEnrollmentSettingsOpen}
        onClose={() => setIsEnrollmentSettingsOpen(false)}
        courseId={id}
        initialRequiresKey={course?.requires_enrollment_key}
        initialHasKey={course?.has_enrollment_key}
        onSaved={(updated) => {
          setCourse(prev => ({
            ...prev,
            requires_enrollment_key: updated.requires_enrollment_key,
            has_enrollment_key: updated.has_enrollment_key
          }));
          fetchCourseData();
        }}
      />
    </div>
  );
};

export default CourseDetailInstructor;

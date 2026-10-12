import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  BookOpen, 
  Users, 
  FileText, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { coursesAPI } from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import CourseFormModal from '../../components/courses/CourseFormModal';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await coursesAPI.getInstructorCourses();
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load instructor courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setActionLoading(true);
      if (editingCourse) {
        await coursesAPI.update(editingCourse.id, formData);
      } else {
        await coursesAPI.create(formData);
      }
      setIsModalOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving course.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? All modules, course materials, assignments, and submissions will be deleted.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await coursesAPI.delete(courseId);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 heading-font">
            Manage Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, edit, and organize syllabus modules and course assignments.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          icon={Plus}
          className="shadow-sm"
        >
          New Course
        </Button>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses created yet"
          description="Get started by creating your first course. You can add syllabus modules, lecture slides, and assignments."
          actionText="Create First Course"
          onAction={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Banner image */}
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  <img
                    src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant={course.status === 'published' ? 'brand' : 'warning'}>
                      {course.status.toUpperCase()}
                    </Badge>
                    <Badge variant="neutral">{course.category}</Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 heading-font">
                    {course.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{course.enrolled_students_count || 0}</span>
                      <span className="text-[10px] text-slate-400">Students</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{course.modules_count || 0}</span>
                      <span className="text-[10px] text-slate-400">Modules</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{course.assignments_count || 0}</span>
                      <span className="text-[10px] text-slate-400">Assignments</span>
                    </div>
                  </div>

                  {course.pending_grading_count > 0 && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-between text-xs text-amber-800">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {course.pending_grading_count} Pending Grading
                      </span>
                      <Link
                        to={`/instructor/courses/${course.id}?tab=assignments`}
                        className="text-[11px] font-bold text-amber-700 underline"
                      >
                        Grade
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2">
                <Link to={`/instructor/courses/${course.id}`} className="flex-1">
                  <Button size="sm" variant="primary" className="w-full" icon={Layers}>
                    Open Course
                  </Button>
                </Link>

                <button
                  onClick={() => {
                    setEditingCourse(course);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Edit Course"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteCourse(course.id, course.title)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Create/Edit Modal */}
      <CourseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingCourse}
        loading={actionLoading}
      />
    </div>
  );
};

export default ManageCourses;

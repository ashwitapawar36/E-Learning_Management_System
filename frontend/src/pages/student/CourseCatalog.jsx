import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import { coursesAPI, enrollmentsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import CourseCard from '../../components/courses/CourseCard';
import EnrollmentKeyModal from '../../components/courses/EnrollmentKeyModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES = [
  'All',
  'Software Engineering',
  'Web Development',
  'Database Systems',
  'DevOps & Cloud',
  'Artificial Intelligence'
];

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState(null);

  const { isAuthenticated, isStudent, isInstructor } = useAuth();
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await coursesAPI.getAll({
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: 'published'
      });
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch course catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleEnroll = async (target) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isInstructor) {
      alert('Instructors cannot enroll as students.');
      return;
    }

    const courseObj = typeof target === 'object' ? target : courses.find(c => c.id === target);
    if (!courseObj) return;

    // Case A: Course requires enrollment key -> open key modal
    if (courseObj.requires_enrollment_key) {
      setSelectedCourseForEnrollment(courseObj);
      return;
    }

    // Case B: Direct enrollment for open courses
    try {
      setEnrollingId(courseObj.id);
      const res = await enrollmentsAPI.enroll(courseObj.id);
      if (res.data.success) {
        navigate(`/student/courses/${courseObj.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error enrolling in course.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-brand-300 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Course Catalog & Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 heading-font">
            Explore All Available Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Browse our university curriculum. Enroll in courses to access lecture materials, lab guides, and assignments.
          </p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course title, syllabus topic, or instructor name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-xs"
          />
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching published courses..." />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try adjusting your search keywords or selecting another category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={course.is_enrolled}
              isInstructor={isInstructor}
              onEnroll={handleEnroll}
              enrolledLoading={enrollingId === course.id}
            />
          ))}
        </div>
      )}

      {/* Course Enrollment Key Modal */}
      <EnrollmentKeyModal
        isOpen={!!selectedCourseForEnrollment}
        onClose={() => setSelectedCourseForEnrollment(null)}
        course={selectedCourseForEnrollment}
        onSuccess={(courseId) => {
          setSelectedCourseForEnrollment(null);
          navigate(`/student/courses/${courseId}`);
        }}
      />
    </div>
  );
};

export default CourseCatalog;

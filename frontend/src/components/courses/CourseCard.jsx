import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const CourseCard = ({ course, onEnroll, isEnrolled, isInstructor, enrolledLoading }) => {
  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail_url || defaultThumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = defaultThumbnail; }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="brand">{course.category || 'Computer Science'}</Badge>
          {course.requires_enrollment_key && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/95 text-white shadow-sm backdrop-blur-sm">
              <Lock className="w-3 h-3" />
              Key Required
            </span>
          )}
          {course.status === 'draft' && (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>
        {isEnrolled && (
          <div className="absolute top-3 right-3 bg-emerald-500/95 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enrolled
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 heading-font">
            {course.title}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
            {course.description || 'No course overview provided.'}
          </p>

          <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
            <span>By <strong className="text-slate-700">{course.instructor_name || 'Instructor'}</strong></span>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {course.enrolled_students_count || 0} students
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {course.modules_count || 0} modules
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {course.assignments_count || 0} tasks
            </span>
          </div>

          {course.max_capacity && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
              <span>Capacity: {course.max_capacity}</span>
              {course.enrollment_deadline && (
                <span className="text-amber-600 font-medium">Closes {new Date(course.enrollment_deadline).toLocaleDateString()}</span>
              )}
            </div>
          )}


          <div className="flex items-center gap-2">
            {isInstructor ? (
              <Link to={`/instructor/courses/${course.id}`} className="w-full">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage Course
                </Button>
              </Link>
            ) : isEnrolled ? (
              <Link to={`/student/courses/${course.id}`} className="w-full">
                <Button variant="primary" size="sm" className="w-full" icon={ArrowRight}>
                  Continue Learning
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link to={`/student/courses/${course.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                {onEnroll && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={enrolledLoading}
                    onClick={() => onEnroll(course)}
                    className="flex-1"
                    icon={course.requires_enrollment_key ? Lock : undefined}
                  >
                    Enroll Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

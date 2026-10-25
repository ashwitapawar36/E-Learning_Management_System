import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  FileText, 
  CheckCircle2, 
  Circle,
  Calendar, 
  Award, 
  Upload, 
  Layers, 
  Clock,
  Sparkles,
  ExternalLink,
  Video,
  Link as LinkIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Check,
  AlertTriangle,
  Info,
  Lock
} from 'lucide-react';
import { coursesAPI, enrollmentsAPI, materialsAPI, submissionsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import SubmissionModal from '../../components/assignments/SubmissionModal';
import EnrollmentKeyModal from '../../components/courses/EnrollmentKeyModal';

const CourseViewStudent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Moodle Course Index sidebar state
  const [isIndexOpen, setIsIndexOpen] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  
  // Collapsed state for main stream sections
  const [collapsedSections, setCollapsedSections] = useState({});

  // Full-content reading modal state for text materials
  const [readingMaterial, setReadingMaterial] = useState(null);

  // Inline expanded material items and assignments
  const [expandedMaterialIds, setExpandedMaterialIds] = useState(new Set());
  const [expandedAssignmentIds, setExpandedAssignmentIds] = useState(new Set());

  const toggleExpandMaterial = (materialId) => {
    setExpandedMaterialIds(prev => {
      const next = new Set(prev);
      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });
  };

  const toggleExpandAssignment = (assignmentId) => {
    setExpandedAssignmentIds(prev => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      return next;
    });
  };

  const handleOpenMaterial = async (material) => {
    if (material.file_url) {
      handleAccessMaterial(material);
    } else {
      setReadingMaterial(material);
      if (course?.is_enrolled && !material.completed) {
        handleAccessMaterial(material);
      }
    }
  };

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

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (user.role === 'instructor') {
      alert('Instructors cannot enroll as students.');
      return;
    }
    setIsKeyModalOpen(true);
  };

  /**
   * Database-backed material access and completion tracking.
   * Accessing a learning resource verifies enrollment, logs completion idempotently,
   * updates the student's progress, and opens the resource.
   */
  const handleAccessMaterial = async (material) => {
    try {
      if (course?.is_enrolled) {
        // Call authorized backend completion endpoint
        const res = await materialsAPI.access(material.id);
        if (res.data.success) {
          // Immediately update local course completion state and progress
          setCourse(prev => {
            if (!prev) return prev;
            const updatedModules = prev.modules?.map(m => ({
              ...m,
              materials: m.materials?.map(mat => 
                mat.id === material.id ? { ...mat, completed: true, completed_at: new Date().toISOString() } : mat
              )
            }));

            // Recalculate completed count
            let completedCount = 0;
            updatedModules?.forEach(m => {
              m.materials?.forEach(mat => { if (mat.completed) completedCount++; });
            });
            prev.assignments?.forEach(a => {
              if (a.completed) completedCount++;
            });

            const total = prev.total_activities_count || 1;
            const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return {
              ...prev,
              modules: updatedModules,
              completed_activities_count: completedCount,
              progress_percentage: percentage
            };
          });

          // Also sync open reader modal state if current reading material is this one
          setReadingMaterial(prev => prev && prev.id === material.id ? { ...prev, completed: true } : prev);
        }
      }

      // Open external link or file
      if (material.file_url) {
        window.open(material.file_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to record material access completion:', err);
      // Fallback: if already opened or link
      if (material.file_url) {
        window.open(material.file_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  /**
   * Database-backed assignment submission handler.
   * Automatically marks the assignment complete in activity_completions.
   */
  const handleSubmitAssignment = async (assignmentId, formData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.submit(assignmentId, formData);
      setSubmittingAssignment(null);
      // Refresh course data to reflect real database-backed completion
      await fetchCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const scrollToActivity = (type, activityId) => {
    const key = `${type}-${activityId}`;
    setSelectedActivityId(key);
    const element = document.getElementById(`activity-${key}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-brand-500', 'bg-brand-50/30');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-brand-500', 'bg-brand-50/30');
      }, 2000);
    }
  };

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getActivityIcon = (type, materialType) => {
    if (type === 'assignment') {
      return <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />;
    }
    switch (materialType) {
      case 'file':
        return <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-sky-600 flex-shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Opening course study room..." />;
  }

  if (!course) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        Course not found or inaccessible.
      </div>
    );
  }

  // Pre-organize assignments by module
  const assignmentsByModule = {};
  const unassignedAssignments = [];

  (course.assignments || []).forEach(a => {
    if (a.module_id) {
      if (!assignmentsByModule[a.module_id]) assignmentsByModule[a.module_id] = [];
      assignmentsByModule[a.module_id].push(a);
    } else {
      unassignedAssignments.push(a);
    }
  });

  const totalActivities = course.total_activities_count || 0;
  const completedActivities = course.completed_activities_count || 0;
  const progressPercentage = course.progress_percentage || 0;

  return (
    <div className="space-y-5">
      {/* 1. Moodle Breadcrumb: Dashboard > My Courses > Course Name */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
        <Link to="/student/dashboard" className="hover:text-brand-600 transition-colors">
          Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <Link to="/courses" className="hover:text-brand-600 transition-colors">
          My Courses
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
          {course.title}
        </span>
      </nav>

      {/* 2. Compact Course Header & Database Progress Bar (No oversized marketing hero) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Course Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm">{course.category || 'General'}</Badge>
              {course.is_enrolled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Enrolled
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  Not Enrolled
                </span>
              )}
              {course.requires_enrollment_key && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" /> Enrollment Key Required
                </span>
              )}
              {course.max_capacity && (
                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                  Capacity: {course.max_capacity} students
                </span>
              )}
              {course.enrollment_deadline && (
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Deadline: {new Date(course.enrollment_deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight heading-font">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>Instructor: <strong className="text-slate-800">{course.instructor_name}</strong></span>
              <span>•</span>
              <span>{course.enrolled_students_count || 0} students enrolled</span>
              {course.description && (
                <>
                  <span>•</span>
                  <span className="text-slate-600 max-w-xl truncate">{course.description}</span>
                </>
              )}
            </div>
          </div>

          {/* Real Database-backed Progress Widget (Replaces manual buttons) */}
          <div className="lg:w-80 flex-shrink-0">
            {course.is_enrolled ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Course Completion</span>
                  <span className="font-extrabold text-brand-600 text-sm">
                    {totalActivities === 0 ? '0%' : `${progressPercentage}%`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {totalActivities === 0 
                       ? 'No activities available'
                      : `${completedActivities} of ${totalActivities} activities done`
                    }
                  </span>
                  {progressPercentage === 100 && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={handleEnroll}
                loading={enrolling}
                className="w-full"
                icon={course.requires_enrollment_key ? Lock : undefined}
              >
                Enroll in Course
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Index Toggle Bar (for small screens & desktop toggle) */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsIndexOpen(!isIndexOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          {isIndexOpen ? (
            <>
              <PanelLeftClose className="w-4 h-4 text-slate-500" />
              <span>Hide Course Index</span>
            </>
          ) : (
            <>
              <PanelLeft className="w-4 h-4 text-slate-500" />
              <span>Show Course Index</span>
            </>
          )}
        </button>

        <span className="text-xs text-slate-400">
          Moodle-Style Activity Stream
        </span>
      </div>

      {/* 3. Main Course Workspace: Left Collapsible Index + Central Activity Content */}
      <div className="flex flex-col lg:flex-row items-start gap-6 relative">
        {/* Course Index (Collapsible Left Navigation) */}
        {isIndexOpen && (
          <aside className="w-full lg:w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Course Index</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {totalActivities} items
              </span>
            </div>

            {/* List of Modules and nested activities */}
            <div className="space-y-4">
              {(!course.modules || course.modules.length === 0) && unassignedAssignments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activities or sections available.
                </div>
              ) : (
                <>
                  {course.modules?.map((mod, modIdx) => {
                    const modMaterials = mod.materials || [];
                    const modAssignments = assignmentsByModule[mod.id] || [];
                    const modItemCount = modMaterials.length + modAssignments.length;

                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-xs font-bold text-slate-800 py-1 px-1.5 flex items-center justify-between">
                          <span className="truncate">Section {modIdx + 1}: {mod.title}</span>
                          <span className="text-[10px] text-slate-400">{modItemCount}</span>
                        </div>

                        <div className="space-y-0.5 pl-2 border-l border-slate-200">
                          {/* Materials */}
                          {modMaterials.map(mat => {
                            const isSelected = selectedActivityId === `material-${mat.id}`;
                            return (
                              <button
                                key={mat.id}
                                onClick={() => scrollToActivity('material', mat.id)}
                                className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                  isSelected 
                                    ? 'bg-brand-50 text-brand-700 font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {getActivityIcon('material', mat.material_type)}
                                  <span className="truncate">{mat.title}</span>
                                </div>
                                <div className="flex-shrink-0">
                                  {mat.completed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Completed" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-300" title="Incomplete" />
                                  )}
                                </div>
                              </button>
                            );
                          })}

                          {/* Module Assignments */}
                          {modAssignments.map(a => {
                            const isSelected = selectedActivityId === `assignment-${a.id}`;
                            return (
                              <button
                                key={a.id}
                                onClick={() => scrollToActivity('assignment', a.id)}
                                className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                  isSelected 
                                    ? 'bg-brand-50 text-brand-700 font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {getActivityIcon('assignment')}
                                  <span className="truncate">{a.title}</span>
                                </div>
                                <div className="flex-shrink-0">
                                  {a.completed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Submitted & Completed" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-300" title="Incomplete" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* General / Course-Level Section (Assignments without a module) */}
                  {unassignedAssignments.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 py-1 px-1.5 flex items-center justify-between">
                        <span className="truncate">General Course Activities</span>
                        <span className="text-[10px] text-slate-400">{unassignedAssignments.length}</span>
                      </div>
                      <div className="space-y-0.5 pl-2 border-l border-slate-200">
                        {unassignedAssignments.map(a => {
                          const isSelected = selectedActivityId === `assignment-${a.id}`;
                          return (
                            <button
                              key={a.id}
                              onClick={() => scrollToActivity('assignment', a.id)}
                              className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                isSelected 
                                  ? 'bg-brand-50 text-brand-700 font-bold' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {getActivityIcon('assignment')}
                                <span className="truncate">{a.title}</span>
                              </div>
                              <div className="flex-shrink-0">
                                {a.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Submitted & Completed" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-slate-300" title="Incomplete" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}

        {/* 4. Central Course Content: Direct Section & Activity Flow (No horizontal tab switching) */}
        <main className="flex-1 w-full space-y-6">
          {(!course.modules || course.modules.length === 0) && unassignedAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No activities available</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your instructor has not yet published syllabus modules, laboratory handouts, or assignments for this course.
              </p>
            </div>
          ) : (
            <>
              {/* Ordered Module Sections */}
              {course.modules?.map((mod, modIdx) => {
                const modMaterials = mod.materials || [];
                const modAssignments = assignmentsByModule[mod.id] || [];
                const isCollapsed = !!collapsedSections[mod.id];

                return (
                  <section 
                    key={mod.id}
                    id={`section-${mod.id}`}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Moodle Section Header */}
                    <div 
                      onClick={() => toggleSectionCollapse(mod.id)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors border-b border-slate-100 select-none"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                        <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {modIdx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-bold text-slate-900 heading-font truncate">
                            {mod.title}
                          </h2>
                          {mod.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {mod.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-400">
                          {modMaterials.length + modAssignments.length} activities
                        </span>
                        <button className="p-1 text-slate-400 hover:text-slate-600">
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />}
                        </button>
                      </div>
                    </div>

                    {/* Section Activities Stream */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {modMaterials.length === 0 && modAssignments.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No learning materials or assignments published in this section yet.
                          </div>
                        ) : (
                          <>
                            {/* Materials */}
                            {modMaterials.map(mat => {
                              const isExpanded = expandedMaterialIds.has(mat.id);

                              return (
                                <div
                                  key={mat.id}
                                  id={`activity-material-${mat.id}`}
                                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                                >
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 mt-0.5">
                                      {getActivityIcon('material', mat.material_type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenMaterial(mat)}
                                          className="text-left text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors cursor-pointer group inline-flex items-center gap-1.5"
                                        >
                                          <span>{mat.title}</span>
                                          <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <Badge variant="neutral" size="sm" className="capitalize">
                                          {mat.material_type}
                                        </Badge>
                                      </div>
                                      {mat.content && (
                                        <div className="mt-1">
                                          <p className={`text-xs text-slate-600 leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-2'}`}>
                                            {mat.content}
                                          </p>
                                          {mat.content.length > 80 && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpandMaterial(mat.id);
                                              }}
                                              className="mt-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 cursor-pointer"
                                            >
                                              {isExpanded ? (
                                                <>
                                                  <ChevronUp className="w-3 h-3" /> Show less
                                                </>
                                              ) : (
                                                <>
                                                  <ChevronDown className="w-3 h-3" /> Read more inline
                                                </>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: Completion indicator and access button */}
                                  <div className="flex items-center gap-3 sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    {/* Moodle Completion Badge */}
                                    <div>
                                      {mat.completed ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Done</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                                          <span>To do: View</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Action button */}
                                    {mat.file_url ? (
                                      <button
                                        onClick={() => handleAccessMaterial(mat)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors cursor-pointer"
                                      >
                                        {mat.material_type === 'video' ? 'Watch Video' : mat.material_type === 'link' ? 'Open Link' : 'Open Resource'}
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenMaterial(mat)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors cursor-pointer"
                                      >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Read Full Note</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Assignments */}
                            {modAssignments.map(a => {
                              const dueDate = new Date(a.due_date);
                              const isOverdue = dueDate < new Date();
                              const isSubmitted = a.submission_status || a.student_submission_id;

                              return (
                                <div
                                  key={a.id}
                                  id={`activity-assignment-${a.id}`}
                                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                                >
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 flex-shrink-0 mt-0.5">
                                      {getActivityIcon('assignment')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900">
                                          {a.title}
                                        </span>
                                        <Badge variant="purple" size="sm">
                                          Assignment
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-500">
                                          {a.max_points} pts
                                        </span>
                                      </div>
                                      <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${expandedAssignmentIds.has(a.id) ? '' : 'line-clamp-2'}`}>
                                        {a.description}
                                      </p>
                                      {a.description && a.description.length > 80 && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpandAssignment(a.id);
                                          }}
                                          className="mt-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          {expandedAssignmentIds.has(a.id) ? (
                                            <>
                                              <ChevronUp className="w-3 h-3" /> Show less
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown className="w-3 h-3" /> Read more
                                            </>
                                          )}
                                        </button>
                                      )}
                                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {a.grade !== null && a.grade !== undefined && (
                                          <span className="font-bold text-emerald-600 ml-2">
                                            Score: {a.grade} / {a.max_points}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Completion indicator and Submit action */}
                                  <div className="flex items-center gap-3 sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    <div>
                                      {a.completed ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Done</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                                          <span>To do: Submit</span>
                                        </span>
                                      )}
                                    </div>

                                    {course.is_enrolled ? (
                                      <Button
                                        size="sm"
                                        variant={a.completed ? 'secondary' : isOverdue ? 'danger' : 'primary'}
                                        onClick={() => setSubmittingAssignment(a)}
                                        icon={Upload}
                                      >
                                        {a.completed ? 'Resubmit Work' : isOverdue ? 'Submit Late' : 'Add Submission'}
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-slate-400">Enroll to submit</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}

              {/* General Course Activities (Assignments not assigned to any specific module) */}
              {unassignedAssignments.length > 0 && (
                <section 
                  id="section-general"
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 heading-font">
                        General Course Assignments
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Course-level laboratory assignments and practical deliverables.
                      </p>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {unassignedAssignments.length} activities
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {unassignedAssignments.map(a => {
                      const dueDate = new Date(a.due_date);
                      const isOverdue = dueDate < new Date();

                      return (
                        <div
                          key={a.id}
                          id={`activity-assignment-${a.id}`}
                          className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 flex-shrink-0 mt-0.5">
                              {getActivityIcon('assignment')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {a.title}
                                </span>
                                <Badge variant="purple" size="sm">
                                  Assignment
                                </Badge>
                                <span className="text-xs font-bold text-slate-500">
                                  {a.max_points} pts
                                </span>
                              </div>
                              <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${expandedAssignmentIds.has(a.id) ? '' : 'line-clamp-2'}`}>
                                {a.description}
                              </p>
                              {a.description && a.description.length > 80 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandAssignment(a.id);
                                  }}
                                  className="mt-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  {expandedAssignmentIds.has(a.id) ? (
                                    <>
                                      <ChevronUp className="w-3 h-3" /> Show less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3" /> Read more
                                    </>
                                  )}
                                </button>
                              )}
                              <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {a.grade !== null && a.grade !== undefined && (
                                  <span className="font-bold text-emerald-600 ml-2">
                                    Score: {a.grade} / {a.max_points}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div>
                              {a.completed ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Done</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                                  <span>To do: Submit</span>
                                </span>
                              )}
                            </div>

                            {course.is_enrolled ? (
                              <Button
                                size="sm"
                                variant={a.completed ? 'secondary' : isOverdue ? 'danger' : 'primary'}
                                onClick={() => setSubmittingAssignment(a)}
                                icon={Upload}
                              >
                                {a.completed ? 'Resubmit Work' : isOverdue ? 'Submit Late' : 'Add Submission'}
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">Enroll to submit</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Assignment Submission Modal */}
      {submittingAssignment && (
        <SubmissionModal
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmit={handleSubmitAssignment}
          assignment={submittingAssignment}
          loading={actionLoading}
        />
      )}

      {/* Learning Material Full Reader Modal */}
      {readingMaterial && (
        <Modal
          isOpen={!!readingMaterial}
          onClose={() => setReadingMaterial(null)}
          title={readingMaterial.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm" className="capitalize">
                  {readingMaterial.material_type || 'Reading Note'}
                </Badge>
                {readingMaterial.completed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    <Circle className="w-3.5 h-3.5 text-slate-400" /> Reading
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {course?.title}
              </span>
            </div>

            {/* Content view */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 sm:p-6 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
              {readingMaterial.content ? (
                readingMaterial.content
              ) : (
                <p className="text-slate-400 italic">No additional text notes provided for this item.</p>
              )}
            </div>

            {/* External link fallback if any */}
            {readingMaterial.file_url && (
              <div className="p-3 rounded-xl bg-brand-50/60 border border-brand-100 flex items-center justify-between">
                <span className="text-xs text-brand-800 font-medium">External resource attached:</span>
                <a
                  href={readingMaterial.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
                >
                  Open attached link <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {readingMaterial.completed ? 'Marked as completed' : 'Viewing completes this activity'}
              </span>
              <div className="flex items-center gap-2">
                {!readingMaterial.completed && course?.is_enrolled && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => {
                      handleAccessMaterial(readingMaterial);
                    }}
                  >
                    Mark as Done
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setReadingMaterial(null)}
                >
                  Done Reading
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Course Self-Enrollment Key Modal */}
      <EnrollmentKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        course={course}
        onSuccess={async () => {
          setIsKeyModalOpen(false);
          await fetchCourseData();
        }}
      />
    </div>
  );
};

export default CourseViewStudent;

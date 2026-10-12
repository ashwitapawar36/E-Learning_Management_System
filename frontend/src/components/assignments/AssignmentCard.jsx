import React from 'react';
import { Calendar, Award, Clock, FileCheck, ArrowRight, Upload, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const AssignmentCard = ({
  assignment,
  isInstructor = false,
  onSubmitClick,
  onReviewClick,
  onViewGradeClick
}) => {
  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();
  const submissionStatus = assignment.student_status || assignment.submission_status;
  const grade = assignment.grade;

  const getStatusBadge = () => {
    if (grade !== null && grade !== undefined) {
      return (
        <Badge variant="success" size="sm">
          Graded: {grade} / {assignment.max_points}
        </Badge>
      );
    }
    if (submissionStatus === 'submitted' || submissionStatus === 'resubmitted') {
      return <Badge variant="brand" size="sm">Submitted - Pending Review</Badge>;
    }
    if (submissionStatus === 'late') {
      return <Badge variant="warning" size="sm">Submitted Late</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="danger" size="sm">Overdue</Badge>;
    }
    return <Badge variant="neutral" size="sm">Pending Submission</Badge>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {assignment.course_title && (
              <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                {assignment.course_title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex-shrink-0">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{assignment.max_points} pts</span>
          </div>
        </div>

        <h4 className="text-base font-bold text-slate-900 heading-font mt-1">
          {assignment.title}
        </h4>

        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
          {assignment.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {assignment.module_title && (
            <span className="text-slate-400">| Module: {assignment.module_title}</span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        {isInstructor ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500">
              <strong>{assignment.total_submissions_count || assignment.submissions_count || 0}</strong> submissions
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onReviewClick && onReviewClick(assignment)}
              icon={ArrowRight}
            >
              Review & Grade
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            {grade !== null && grade !== undefined ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onViewGradeClick && onViewGradeClick(assignment)}
                icon={FileCheck}
              >
                View Feedback
              </Button>
            ) : submissionStatus ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" /> Work Submitted
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSubmitClick && onSubmitClick(assignment)}
                >
                  Resubmit
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant={isOverdue ? 'danger' : 'primary'}
                onClick={() => onSubmitClick && onSubmitClick(assignment)}
                icon={Upload}
              >
                {isOverdue ? 'Submit Late' : 'Submit Work'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;

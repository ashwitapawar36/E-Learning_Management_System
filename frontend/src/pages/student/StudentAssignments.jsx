import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, Upload, Award } from 'lucide-react';
import { assignmentsAPI, submissionsAPI } from '../../services/api';
import AssignmentCard from '../../components/assignments/AssignmentCard';
import SubmissionModal from '../../components/assignments/SubmissionModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const FILTERS = ['All', 'Pending', 'Submitted', 'Graded', 'Overdue'];

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsAPI.getMy();
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (assignmentId, formData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.submit(assignmentId, formData);
      setSubmittingAssignment(null);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Graded') return a.overall_status === 'graded';
    if (activeFilter === 'Submitted') return a.overall_status === 'submitted' || a.overall_status === 'graded';
    if (activeFilter === 'Pending') return a.overall_status === 'pending';
    if (activeFilter === 'Overdue') return a.overall_status === 'overdue';
    return true;
  });

  if (loading) {
    return <LoadingSpinner text="Loading assignments & deadlines..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 heading-font">
          My Assignments & Coursework
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track deadlines, submit lab exercises, and review grading evaluations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map((f) => {
          const count = assignments.filter((a) => {
            if (f === 'All') return true;
            if (f === 'Graded') return a.overall_status === 'graded';
            if (f === 'Submitted') return a.overall_status === 'submitted' || a.overall_status === 'graded';
            if (f === 'Pending') return a.overall_status === 'pending';
            if (f === 'Overdue') return a.overall_status === 'overdue';
            return true;
          }).length;

          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <span>{f}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === f ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Assignment Cards */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No ${activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} assignments found`}
          description="Check back later or view assignments for other enrolled courses."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={{
                ...assignment,
                id: assignment.assignment_id,
                title: assignment.assignment_title
              }}
              isInstructor={false}
              onSubmitClick={(a) => setSubmittingAssignment(a)}
            />
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {submittingAssignment && (
        <SubmissionModal
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmit={handleSubmit}
          assignment={submittingAssignment}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default StudentAssignments;

import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Calendar, MessageSquare, Download, CheckCircle, Clock } from 'lucide-react';
import { assignmentsAPI } from '../../services/api';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatCard from '../../components/common/StatCard';

const StudentGrades = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const res = await assignmentsAPI.getMy();
        if (res.data.success) {
          setAssignments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load grades:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling student gradebook..." />;
  }

  const gradedList = assignments.filter(a => a.grade !== null && a.grade !== undefined);
  const totalEarned = gradedList.reduce((acc, a) => acc + parseFloat(a.grade), 0);
  const totalMax = gradedList.reduce((acc, a) => acc + parseInt(a.max_points, 10), 0);
  const overallPercentage = totalMax > 0 ? ((totalEarned / totalMax) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 heading-font">
          Academic Gradebook & Evaluator Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed transcript of all assignment evaluations, scores, and instructor feedback.
        </p>
      </div>

      {/* Grade Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Overall Average"
          value={totalMax > 0 ? `${overallPercentage}%` : 'N/A'}
          icon={Award}
          color="emerald"
          subtitle="Cumulative score across graded tasks"
        />
        <StatCard
          title="Points Earned"
          value={`${totalEarned.toFixed(1)} / ${totalMax}`}
          icon={CheckCircle}
          color="brand"
          subtitle={`${gradedList.length} assignments graded`}
        />
        <StatCard
          title="Pending Evaluation"
          value={assignments.filter(a => a.submission_id && a.grade === null).length}
          icon={Clock}
          color="amber"
          subtitle="Submitted tasks waiting for grade"
        />
      </div>

      {/* Gradebook Table */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No coursework records found"
          description="Enroll in courses and turn in assignments to view grades."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Course & Assignment</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Score / Max Points</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Instructor Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assignments.map((item) => {
                  const isGraded = item.grade !== null && item.grade !== undefined;
                  const percentage = isGraded ? ((item.grade / item.max_points) * 100).toFixed(0) : null;

                  return (
                    <tr key={item.assignment_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.assignment_title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{item.course_title}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {item.submitted_at ? (
                          <div>{new Date(item.submitted_at).toLocaleDateString()}</div>
                        ) : (
                          <span className="text-slate-400 italic">Not submitted</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isGraded ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-emerald-600">
                              {item.grade} / {item.max_points}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              {percentage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">— / {item.max_points}</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isGraded ? (
                          <Badge variant="success">Graded</Badge>
                        ) : item.submission_id ? (
                          <Badge variant="brand">Pending Grade</Badge>
                        ) : new Date(item.due_date) < new Date() ? (
                          <Badge variant="danger">Overdue</Badge>
                        ) : (
                          <Badge variant="neutral">Not Turned In</Badge>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {item.feedback ? (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 max-w-sm flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-relaxed">"{item.feedback}"</span>
                          </div>
                        ) : isGraded ? (
                          <span className="text-slate-400 italic text-[11px]">No written remarks</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Awaiting review</span>
                        )}
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
  );
};

export default StudentGrades;

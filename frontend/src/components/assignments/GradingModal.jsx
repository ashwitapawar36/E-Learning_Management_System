import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Award, Download, User, Calendar, MessageSquare } from 'lucide-react';

const GradingModal = ({
  isOpen,
  onClose,
  onSubmit,
  submission,
  maxPoints = 100,
  loading = false
}) => {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (submission) {
      setGrade(submission.grade !== null && submission.grade !== undefined ? submission.grade : '');
      setFeedback(submission.feedback || '');
    }
  }, [submission, isOpen]);

  if (!submission) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxPoints) {
      alert(`Please enter a valid grade between 0 and ${maxPoints}.`);
      return;
    }
    onSubmit(submission.id, {
      grade: numericGrade,
      feedback
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Evaluate Submission - ${submission.student_name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student submission info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {submission.student_name} ({submission.student_email})
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(submission.submitted_at).toLocaleString()}
            </span>
          </div>

          {submission.content && (
            <div className="pt-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 font-mono">
              <strong>Student Notes:</strong>
              <p className="mt-1 whitespace-pre-wrap">{submission.content}</p>
            </div>
          )}

          {submission.file_url ? (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Uploaded File:</span>
              <a
                href={submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download / View Attachment
              </a>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No file attachment provided (Text-only submission).</div>
          )}
        </div>

        {/* Grade Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Score / Grade (Out of {maxPoints} points) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              max={maxPoints}
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder={`0 - ${maxPoints}`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold pr-16"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
              / {maxPoints}
            </span>
          </div>
        </div>

        {/* Feedback Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Instructor Feedback & Remarks
          </label>
          <textarea
            rows="4"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide constructive feedback, highlight strengths, or point out areas for improvement..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={Award}>
            Submit Grade & Notify Student
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GradingModal;

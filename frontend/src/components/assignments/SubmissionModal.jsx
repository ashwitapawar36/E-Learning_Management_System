import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Upload, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const SubmissionModal = ({ isOpen, onClose, onSubmit, assignment, loading = false }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);

  if (!assignment) return null;

  const dueDate = new Date(assignment.due_date);
  const isLate = new Date() > dueDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file && !content.trim()) {
      alert('Please provide either an uploaded file or text submission.');
      return;
    }

    const data = new FormData();
    if (file) {
      data.append('submission_file', file);
    }
    if (content) {
      data.append('content', content);
    }

    onSubmit(assignment.id || assignment.assignment_id, data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Work: ${assignment.title || assignment.assignment_title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Late submission warning if applicable */}
        {isLate ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-semibold block">Late Submission Notice</strong>
              The deadline was {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Your submission will be recorded and marked as <em>Late</em>.
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 flex items-center gap-3 text-xs">
            <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Due on <strong>{dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>. Max Score: <strong>{assignment.max_points} points</strong>.</span>
          </div>
        )}

        {/* File Upload Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Upload Submission File (PDF, DOCX, ZIP, Code)
          </label>
          <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:bg-slate-50 transition-colors">
            <Upload className="w-8 h-8 text-brand-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Click to browse files or drag and drop here'}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports .pdf, .zip, .docx, .py, .java, .js, .txt (Max 50MB)
            </span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>

        {/* Text Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Submission Notes & Comments (Optional)
          </label>
          <textarea
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add any notes for the instructor, link repositories, or write answers directly..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={Upload}>
            Confirm & Turn In
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SubmissionModal;

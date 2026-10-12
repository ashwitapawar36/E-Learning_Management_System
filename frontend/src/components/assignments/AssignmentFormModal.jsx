import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Upload } from 'lucide-react';

const AssignmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  modules = [],
  initialData = null,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 100,
    module_id: '',
    status: 'published'
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      const formattedDate = initialData.due_date 
        ? new Date(initialData.due_date).toISOString().slice(0, 16) 
        : '';
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        due_date: formattedDate,
        max_points: initialData.max_points || 100,
        module_id: initialData.module_id || '',
        status: initialData.status || 'published'
      });
    } else {
      // Default due date to 7 days from now
      const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      setFormData({
        title: '',
        description: '',
        due_date: defaultDue,
        max_points: 25,
        module_id: modules[0]?.id || '',
        status: 'published'
      });
      setAttachmentFile(null);
    }
  }, [initialData, isOpen, modules]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('due_date', new Date(formData.due_date).toISOString());
    data.append('max_points', formData.max_points);
    if (formData.module_id) data.append('module_id', formData.module_id);
    data.append('status', formData.status);
    if (attachmentFile) {
      data.append('attachment', attachmentFile);
    }
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Assignment' : 'Create New Assignment'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Experiment 3: UML Class Diagram Design"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Instructions & Rubric Guidelines *
          </label>
          <textarea
            rows="3"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Specify assignment requirements, expected deliverables, formatting rules, and evaluation criteria..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Submission Deadline *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Points / Score *
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              required
              value={formData.max_points}
              onChange={(e) => setFormData({ ...formData, max_points: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Associated Module (Optional)
            </label>
            <select
              value={formData.module_id}
              onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
            >
              <option value="">-- No specific module --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
            >
              <option value="published">Published (Visible to students)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Supplementary Assignment Material (PDF / Starter code)
          </label>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>{attachmentFile ? attachmentFile.name : 'Attach Reference File (Optional)'}</span>
            <input
              type="file"
              onChange={(e) => setAttachmentFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Assignment' : 'Publish Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentFormModal;

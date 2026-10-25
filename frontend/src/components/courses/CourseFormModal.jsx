import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { 
  Upload, 
  Image as ImageIcon, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  Copy, 
  AlertCircle, 
  Shield 
} from 'lucide-react';

const generateRandomEnrollmentKey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const CourseFormModal = ({ isOpen, onClose, onSubmit, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    status: 'published'
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Enrollment Settings
  const [requiresEnrollmentKey, setRequiresEnrollmentKey] = useState(false);
  const [enrollmentKey, setEnrollmentKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'Computer Science',
        status: initialData.status || 'published'
      });
      setPreviewUrl(initialData.thumbnail_url || '');
      setRequiresEnrollmentKey(Boolean(initialData.requires_enrollment_key));
      setHasExistingKey(Boolean(initialData.has_enrollment_key));
      setEnrollmentKey('');
      setShowKey(false);
      setGeneratedKey('');
      setCopied(false);
      setKeyError('');
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Software Engineering',
        status: 'published'
      });
      setThumbnailFile(null);
      setPreviewUrl('');
      setRequiresEnrollmentKey(false);
      setHasExistingKey(false);
      setEnrollmentKey('');
      setShowKey(false);
      setGeneratedKey('');
      setCopied(false);
      setKeyError('');
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerateKey = () => {
    const newKey = generateRandomEnrollmentKey();
    setEnrollmentKey(newKey);
    setRequiresEnrollmentKey(true);
    setShowKey(true);
    setGeneratedKey(newKey);
    setKeyError('');
  };

  const handleCopyKey = () => {
    if (enrollmentKey) {
      navigator.clipboard.writeText(enrollmentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setKeyError('');

    if (requiresEnrollmentKey) {
      if (enrollmentKey.trim()) {
        if (enrollmentKey.trim().length < 6) {
          setKeyError('Enrollment key must contain at least 6 characters.');
          return;
        }
      } else if (!hasExistingKey) {
        setKeyError('An enrollment key of at least 6 characters is required when enabling enrollment keys.');
        return;
      }
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('status', formData.status);
    data.append('requires_enrollment_key', requiresEnrollmentKey);
    if (enrollmentKey.trim()) {
      data.append('enrollment_key', enrollmentKey.trim());
    }
    if (thumbnailFile) {
      data.append('thumbnail', thumbnailFile);
    }
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Course Details' : 'Create New Course'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Course Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Advanced Software Engineering & System Design"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Course Overview & Syllabus Summary
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide course learning outcomes, prerequisites, and syllabus highlights..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium bg-white"
            >
              <option value="Software Engineering">Software Engineering</option>
              <option value="Web Development">Web Development</option>
              <option value="Database Systems">Database Systems</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Computer Networks">Computer Networks</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Publication Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium bg-white"
            >
              <option value="published">Published (Visible in Catalog)</option>
              <option value="draft">Draft (Work in progress)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Enrollment Settings Section */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-600" />
                Enrollment Settings
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Enable self-enrollment key protection for this course
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresEnrollmentKey}
                onChange={(e) => {
                  setRequiresEnrollmentKey(e.target.checked);
                  if (keyError) setKeyError('');
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {keyError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>{keyError}</span>
            </div>
          )}

          {requiresEnrollmentKey && (
            <div className="space-y-3 pt-2 border-t border-slate-200/80">
              {hasExistingKey && !enrollmentKey && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Key configured
                  </span>
                  <span className="text-[11px] text-emerald-600">
                    (Leave empty to preserve existing key)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enrollment Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={enrollmentKey}
                    onChange={(e) => {
                      setEnrollmentKey(e.target.value);
                      if (keyError) setKeyError('');
                    }}
                    placeholder={hasExistingKey ? 'Enter new key to change (or leave empty)' : 'Auto-generated if left empty (e.g. ELMS-A1B2-C3D4)'}
                    className="w-full pl-3 pr-20 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {enrollmentKey && (
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Copy key"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  A unique, secure enrollment key is automatically generated if left empty.
                </span>
              </div>

              {/* Generated Key One-Time Display Banner */}
              {generatedKey && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-amber-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Generated Key:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy Key'}
                    </button>
                  </div>
                  <div className="font-mono font-bold text-xs bg-white/90 p-1.5 rounded-md border border-amber-200 tracking-wider">
                    {generatedKey}
                  </div>
                </div>
              )}

              {/* Generate Key Button */}
              <button
                type="button"
                onClick={handleGenerateKey}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-brand-200 bg-white text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                Generate Random Key
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Course Cover Banner
          </label>
          <div className="mt-1 flex items-center gap-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-slate-200"
              />
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>{thumbnailFile ? thumbnailFile.name : 'Choose Banner Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseFormModal;

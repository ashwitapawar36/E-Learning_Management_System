import React, { useState, useEffect } from 'react';
import { Key, Lock, Eye, EyeOff, Sparkles, Check, Copy, AlertCircle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { coursesAPI } from '../../services/api';

const generateRandomEnrollmentKey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const EnrollmentSettingsModal = ({ 
  isOpen, 
  onClose, 
  courseId, 
  initialRequiresKey = false, 
  initialHasKey = false,
  onSaved 
}) => {
  const [requiresKey, setRequiresKey] = useState(false);
  const [enrollmentKey, setEnrollmentKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRequiresKey(Boolean(initialRequiresKey));
      setHasExistingKey(Boolean(initialHasKey));
      setEnrollmentKey('');
      setShowKey(false);
      setGeneratedKey('');
      setCopied(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialRequiresKey, initialHasKey]);

  const handleGenerateKey = () => {
    const newKey = generateRandomEnrollmentKey();
    setEnrollmentKey(newKey);
    setRequiresKey(true);
    setShowKey(true);
    setGeneratedKey(newKey);
    setError('');
  };

  const handleCopyKey = () => {
    if (enrollmentKey) {
      navigator.clipboard.writeText(enrollmentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (requiresKey) {
      if (enrollmentKey.trim()) {
        if (enrollmentKey.trim().length < 6) {
          setError('Enrollment key must contain at least 6 characters.');
          return;
        }
      } else if (!hasExistingKey) {
        setError('An enrollment key of at least 6 characters is required when enabling enrollment keys.');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        requires_enrollment_key: requiresKey,
        enrollment_key: enrollmentKey.trim() || undefined
      };
      const res = await coursesAPI.updateEnrollmentSettings(courseId, payload);
      if (res.data.success) {
        setSuccessMsg('Enrollment settings saved successfully.');
        setHasExistingKey(res.data.data.has_enrollment_key);
        if (onSaved) {
          onSaved(res.data.data);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save enrollment settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Course Enrollment Settings"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Information Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Moodle-Style Self-Enrollment Control
          </p>
          Control student self-enrollment access. When enabled, students must provide the configured key to enroll. Existing enrolled students will retain uninterrupted access.
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Enable / Disable Toggle */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Enable Enrollment Key
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Require a key for new student self-enrollments
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresKey}
                onChange={(e) => {
                  setRequiresKey(e.target.checked);
                  if (error) setError('');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Enrollment Key Input & Controls (when enabled) */}
        {requiresKey && (
          <div className="space-y-3 p-4 rounded-xl border border-brand-100 bg-brand-50/20">
            {hasExistingKey && !enrollmentKey && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                <span className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Key configured
                </span>
                <span className="text-[11px] text-emerald-600">
                  (Hashed securely)
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {hasExistingKey ? 'Update Enrollment Key' : 'Enrollment Key *'}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={enrollmentKey}
                  onChange={(e) => {
                    setEnrollmentKey(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={hasExistingKey ? 'Enter new key to change (or leave empty)' : 'Min 6 characters (e.g. CS401-2026)'}
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium bg-white"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {enrollmentKey && (
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                      title="Copy key"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum 6 characters. Keys are hashed securely with bcrypt.
              </span>
            </div>

            {/* Generated Key One-Time Display Banner */}
            {generatedKey && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1 text-amber-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Newly Generated Key:
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
                <div className="font-mono font-bold text-sm bg-white/80 p-2 rounded-lg border border-amber-200/80 tracking-widest text-slate-900">
                  {generatedKey}
                </div>
                <p className="text-[10px] text-amber-700">
                  Please copy this key now. Because keys are securely hashed in the database, it cannot be recovered in plaintext once saved.
                </p>
              </div>
            )}

            {/* Generate Key Button */}
            <button
              type="button"
              onClick={handleGenerateKey}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-brand-200 bg-white text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              Generate Random Key
            </button>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Save Enrollment Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EnrollmentSettingsModal;

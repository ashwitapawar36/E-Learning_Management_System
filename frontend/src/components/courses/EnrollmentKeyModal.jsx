import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { enrollmentsAPI } from '../../services/api';

const EnrollmentKeyModal = ({ isOpen, onClose, course, onSuccess }) => {
  const [enrollmentKey, setEnrollmentKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const navigate = useNavigate();

  if (!course) return null;

  const handleClose = () => {
    setEnrollmentKey('');
    setShowKey(false);
    setErrorMessage('');
    setSuccessMessage('');
    setAlreadyEnrolled(false);
    onClose();
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollmentKey.trim()) {
      setErrorMessage('Please enter the course enrollment key.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      setAlreadyEnrolled(false);

      const res = await enrollmentsAPI.enroll(course.id, enrollmentKey.trim());
      if (res.data.success) {
        setSuccessMessage('Enrollment successful! Redirecting to course...');
        setTimeout(() => {
          handleClose();
          if (onSuccess) {
            onSuccess(course.id);
          }
        }, 800);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setAlreadyEnrolled(true);
        setErrorMessage(err.response?.data?.message || 'You are already actively enrolled in this course.');
      } else {
        const serverMsg = err.response?.data?.message;
        setErrorMessage(serverMsg || 'Incorrect enrollment key. Please check the key provided by your instructor and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Course Self-Enrollment"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleEnroll} className="space-y-4">
        {/* Course Info Header */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Enrollment Key Required
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5 heading-font">
                {course.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This course requires a private enrollment key provided by your instructor to self-enroll.
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex flex-col gap-2 animate-shake">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {alreadyEnrolled && (
              <div className="pt-2 border-t border-rose-200/60 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => {
                    handleClose();
                    navigate(`/student/courses/${course.id}`);
                  }}
                >
                  Go to Course
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Enrollment Key Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Enrollment Key *
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              required
              value={enrollmentKey}
              onChange={(e) => {
                setEnrollmentKey(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Enter enrollment key..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Keys are case-sensitive. Contact your course instructor if you do not have a key.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={Lock}
          >
            Submit / Enroll
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EnrollmentKeyModal;

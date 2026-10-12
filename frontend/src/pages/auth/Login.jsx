import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, Lock, Mail, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else if (loggedUser.role === 'instructor' || loggedUser.role === 'admin') {
        navigate('/instructor/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 mb-4">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white heading-font">
            Sign in to E-LMS
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            PostgreSQL-Powered E-Learning Management System
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass-panel-dark py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-700/60 backdrop-blur-xl">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ashwita.pawar@elms.edu"
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full shadow-lg shadow-brand-500/30"
                  icon={ArrowRight}
                >
                  Sign In to Account
                </Button>
              </div>
            </form>

            {/* Quick Demo Logins */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
                Quick Demo Logins (Auto-Fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ashwita.pawar@elms.edu')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Instructor</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">Dr. Ashwita</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('riddhi@elms.edu')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">Riddhi P.</div>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
                Register as Student or Instructor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

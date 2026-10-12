import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { 
  GraduationCap, 
  Bell, 
  User, 
  LogOut, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Layers, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';
import Badge from './Badge';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isInstructor, isStudent } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 heading-font">
                  E-LMS
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Clean spacious header - Navigation preserved via Sidebar */}
          <div className="flex-1" />


          {/* Right: Notification & Profile */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-3 z-50 border border-slate-100">
                      <div className="flex items-center justify-between pb-2.5 px-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                          {unreadCount > 0 && (
                            <Badge variant="danger" size="sm">{unreadCount} new</Badge>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 mt-2">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!n.is_read) markAsRead(n.id);
                                if (n.link) {
                                  setShowNotifs(false);
                                  navigate(n.link);
                                }
                              }}
                              className={`p-3 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 ${
                                !n.is_read ? 'bg-brand-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(n.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left text-xs">
                      <div className="font-semibold text-slate-800 leading-tight">{user.name}</div>
                      <div className="text-slate-400 capitalize">{user.role}</div>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-2 z-50 border border-slate-100">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1.5">
                          <Badge variant={user.role === 'instructor' ? 'purple' : 'brand'} size="sm">
                            {user.role.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to={isInstructor ? '/instructor/dashboard' : '/student/dashboard'}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Layers className="w-4 h-4 text-slate-400" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all shadow-brand-500/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

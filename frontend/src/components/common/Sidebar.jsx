import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Award, 
  PlusCircle, 
  Users, 
  CheckSquare, 
  Settings, 
  FolderGit2
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { isInstructor, isStudent } = useAuth();

  const instructorNav = [
    { name: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/instructor/courses', icon: BookOpen },
    { name: 'Course Catalog', path: '/courses', icon: FolderGit2 },
  ];

  const studentNav = [
    { name: 'My Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Course Catalog', path: '/courses', icon: BookOpen },
    { name: 'Assignments', path: '/student/assignments', icon: FileText },
    { name: 'Grades & Feedback', path: '/student/grades', icon: Award },
  ];

  const links = isInstructor ? instructorNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-4 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isInstructor ? 'Instructor Workspace' : 'Student Workspace'}
            </div>
            <nav className="mt-2 space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Quick Info Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-brand-300 tracking-wider uppercase">Direct Postgres</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-xs font-bold text-white">ELMS Active Pool</p>
            <p className="text-[11px] text-slate-300 mt-0.5">Direct pg client queries with ACID transactions</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

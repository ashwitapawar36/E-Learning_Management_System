import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout & Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ManageCourses from './pages/instructor/ManageCourses';
import CourseDetailInstructor from './pages/instructor/CourseDetailInstructor';
import AssignmentSubmissions from './pages/instructor/AssignmentSubmissions';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseCatalog from './pages/student/CourseCatalog';
import CourseViewStudent from './pages/student/CourseViewStudent';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentGrades from './pages/student/StudentGrades';

// Root Redirect component
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/courses" replace />;
  if (user.role === 'instructor' || user.role === 'admin') {
    return <Navigate to="/instructor/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public standalone auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Application shell with Navbar & Sidebar */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/courses" element={<CourseCatalog />} />

              {/* Instructor Protected Routes */}
              <Route
                path="/instructor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <ManageCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses/:id"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <CourseDetailInstructor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses/:courseId/assignments/:assignmentId"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <AssignmentSubmissions />
                  </ProtectedRoute>
                }
              />

              {/* Student Protected Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/courses/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <CourseViewStudent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/assignments"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/grades"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentGrades />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/courses" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

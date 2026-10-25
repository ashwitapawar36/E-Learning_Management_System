import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local storage
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // localStorage.removeItem('elms_token');
        // localStorage.removeItem('elms_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData)
};

// Course Endpoints
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getProgress: (id) => api.get(`/courses/${id}/progress`),
  getInstructorCourses: () => api.get('/courses/instructor'),
  create: (formData) => api.post('/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/courses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateEnrollmentSettings: (id, data) => api.put(`/courses/${id}/enrollment-settings`, data),
  getEnrollmentKey: (id) => api.get(`/courses/${id}/enrollment-key`),
  regenerateEnrollmentKey: (id) => api.post(`/courses/${id}/regenerate-enrollment-key`),
  delete: (id) => api.delete(`/courses/${id}`)
};

// Enrollment Endpoints
export const enrollmentsAPI = {
  enroll: (courseId, enrollmentKey) => api.post(`/enrollments/courses/${courseId}/enroll`, enrollmentKey ? { enrollment_key: enrollmentKey } : {}),
  drop: (courseId) => api.post(`/enrollments/courses/${courseId}/drop`),
  getMy: () => api.get('/enrollments/my'),
  getStudents: (courseId) => api.get(`/enrollments/courses/${courseId}/students`),
  recalculateProgress: (courseId) => api.put(`/enrollments/courses/${courseId}/progress`)
};

// Module Endpoints
export const modulesAPI = {
  getByCourse: (courseId) => api.get(`/modules/courses/${courseId}/modules`),
  create: (courseId, data) => api.post(`/modules/courses/${courseId}/modules`, data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`)
};

// Material Endpoints
export const materialsAPI = {
  getByModule: (moduleId) => api.get(`/materials/modules/${moduleId}/materials`),
  access: (id) => api.get(`/materials/${id}/access`),
  create: (moduleId, formData) => api.post(`/materials/modules/${moduleId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/materials/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/materials/${id}`)
};

// Assignment Endpoints
export const assignmentsAPI = {
  getMy: () => api.get('/assignments/my'),
  getByCourse: (courseId) => api.get(`/assignments/courses/${courseId}/assignments`),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (courseId, formData) => api.post(`/assignments/courses/${courseId}/assignments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/assignments/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  toggleGradeRelease: (id, grades_released) => api.put(`/assignments/${id}/release-grades`, { grades_released }),
  delete: (id) => api.delete(`/assignments/${id}`)
};

// Submission Endpoints
export const submissionsAPI = {
  submit: (assignmentId, formData) => api.post(`/submissions/assignments/${assignmentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMySubmission: (assignmentId) => api.get(`/submissions/assignments/${assignmentId}/my`),
  getByAssignment: (assignmentId) => api.get(`/submissions/assignments/${assignmentId}`),
  grade: (submissionId, gradeData) => api.put(`/submissions/${submissionId}/grade`, gradeData)
};

// Notification Endpoints
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

// Analytics Endpoints
export const analyticsAPI = {
  getInstructorDashboard: () => api.get('/analytics/instructor'),
  getStudentDashboard: () => api.get('/analytics/student')
};

export default api;

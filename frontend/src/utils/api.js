import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://dlmc-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      // Redirect to login page on network error (backend might be down)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('Authentication error - redirecting to login');
      localStorage.removeItem('user'); // Clear any stale user data
      window.location.href = '/login';
    }

    // Handle forbidden errors
    if (error.response?.status === 403) {
      console.error('Forbidden - insufficient permissions');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data?.error || 'Internal server error');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Applications API
export const applicationsAPI = {
  create: (data) => api.post('/applications/', data),
  getAll: (params) => api.get('/applications/', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}`, data),
  updateStage: (id, data) => api.post(`/applications/${id}/stage`, data),
};

// Committee API
export const committeeAPI = {
  getPendingApplications: () => api.get('/committee/applications/pending'),
  assignApplication: (id, data) => api.post(`/committee/applications/${id}/assign`, data),
  recordInterview: (id, data) => api.post(`/committee/applications/${id}/interview`, data),
  getMembers: () => api.get('/committee/members'),
  getStatistics: () => api.get('/committee/statistics'),
};

// Courtship API
export const courtshipAPI = {
  initialize: (applicationId) => api.post(`/courtship/applications/${applicationId}/initialize`),
  getTopics: (applicationId) => api.get(`/courtship/applications/${applicationId}/topics`),
  updateTopic: (topicId, data) => api.put(`/courtship/topics/${topicId}`, data),
  getCheckIns: (applicationId) => api.get(`/courtship/applications/${applicationId}/checkins`),
  updateCheckIn: (checkInId, data) => api.put(`/courtship/checkins/${checkInId}`, data),
  getProgress: (applicationId) => api.get(`/courtship/applications/${applicationId}/progress`),
};

// Medical API
export const medicalAPI = {
  createTest: (applicationId, data) => api.post(`/medical/applications/${applicationId}/tests`, data),
  getTests: (applicationId) => api.get(`/medical/applications/${applicationId}/tests`),
  updateTest: (testId, data) => api.put(`/medical/tests/${testId}`, data),
  getCompatibility: (applicationId) => api.get(`/medical/applications/${applicationId}/compatibility`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: (limit) => api.get('/dashboard/recent-activity', { params: { limit } }),
  getUpcomingCheckIns: () => api.get('/dashboard/upcoming-checkins'),
  getApplicationsByMonth: () => api.get('/dashboard/applications-by-month'),
  getLocations: () => api.get('/dashboard/locations'),
  getCourtshipCompletion: () => api.get('/dashboard/courtship-completion'),
  getRegionalStatistics: () => api.get('/dashboard/regional-statistics'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications/', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUsersByRegion: () => api.get('/admin/users/by-region'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  resetPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats/overview'),
};

// Meetings API
export const meetingsAPI = {
  schedule: (applicationId, data) => api.post(`/meetings/applications/${applicationId}/meetings`, data),
  getByApplication: (applicationId) => api.get(`/meetings/applications/${applicationId}/meetings`),
  getById: (id) => api.get(`/meetings/meetings/${id}`),
  update: (id, data) => api.put(`/meetings/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/meetings/${id}`),
};

// Discussions API
export const discussionsAPI = {
  create: (data) => api.post('/discussions/', data),
  getAll: (params) => api.get('/discussions/', { params }),
  getById: (id) => api.get(`/discussions/${id}`),
  update: (id, data) => api.put(`/discussions/${id}`, data),
  delete: (id) => api.delete(`/discussions/${id}`),
  addReply: (id, data) => api.post(`/discussions/${id}/replies`, data),
};

// Complaints API
export const complaintsAPI = {
  submit: (data) => api.post('/complaints/', data),
  getAll: (params) => api.get('/complaints/', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  getMyComplaints: () => api.get('/complaints/my-complaints'),
};

// Courtship Tracking API
export const courtshipTrackingAPI = {
  getAllTopics: () => api.get('/courtship-tracking/topics'),
  getTopicByWeek: (week) => api.get(`/courtship-tracking/topics/${week}`),
  getProgress: (applicationId) => api.get(`/courtship-tracking/progress/${applicationId}`),
  updateProgress: (applicationId, week, data) => api.post(`/courtship-tracking/progress/${applicationId}/week/${week}`, data),
  getCurrentWeek: (applicationId) => api.get(`/courtship-tracking/progress/${applicationId}/current`),
  initializeProgress: (applicationId) => api.post(`/courtship-tracking/progress/${applicationId}/initialize`),
  getSupervisorNotes: () => api.get('/courtship-tracking/supervisor-notes'),
};

export default api;


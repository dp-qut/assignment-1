import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  // Set auth token in headers
  setAuthToken(token) {
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.common['Authorization'];
    }
  }

  // Remove auth token
  removeAuthToken() {
    delete API.defaults.headers.common['Authorization'];
  }

  // Register user
  async register(userData) {
    const response = await API.post('/auth/register', userData);
    return response.data;
  }

  // Login user
  async login(credentials) {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  }

  // Logout user
  async logout() {
    const response = await API.post('/auth/logout');
    return response.data;
  }

  // Get current user
  async getMe() {
    const response = await API.get('/auth/me');
    return response.data;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await API.post('/auth/verify-email', { token });
    return response.data;
  }

  // Resend verification email
  async resendVerification(email) {
    const response = await API.post('/auth/resend-verification', { email });
    return response.data;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Reset password
  async resetPassword(token, password) {
    const response = await API.post('/auth/reset-password', { token, password });
    return response.data;
  }

  // Change password
  async changePassword(passwords) {
    const response = await API.put('/auth/change-password', passwords);
    return response.data;
  }

  // Update profile
  async updateProfile(userData) {
    const response = await API.put('/auth/profile', userData);
    return response.data;
  }

  // Delete account
  async deleteAccount(password) {
    const response = await API.delete('/auth/account', { data: { password } });
    return response.data;
  }

  // Check token validity
  async checkToken() {
    const response = await API.get('/auth/check-token');
    return response.data;
  }
}

const authService = new AuthService();
export default authService;

// Visa Type Service
export const visaTypeService = {
  getVisaTypes: () => API.get('/visa-types'),
  getVisaTypeById: (id) => API.get(`/visa-types/${id}`),
  createVisaType: (data) => API.post('/admin/visa-types', data),
  updateVisaType: (id, data) => API.put(`/admin/visa-types/${id}`, data),
  deleteVisaType: (id) => API.delete(`/admin/visa-types/${id}`)
};

// Document Service
export const documentService = {
  uploadDocument: (formData, onUploadProgress) => 
    API.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    }),
  getDocument: (id) => API.get(`/documents/${id}`),
  downloadDocument: (id) => API.get(`/documents/${id}/download`, { responseType: 'blob' }),
  deleteDocument: (id) => API.delete(`/documents/${id}`),
  getMyDocuments: () => API.get('/documents/my')
};

// Application Service  
export const applicationService = {
  createApplication: (data) => API.post('/applications', data),
  getMyApplications: () => API.get('/applications/my'),
  getApplicationById: (id) => API.get(`/applications/${id}`),
  updateApplication: (id, data) => API.put(`/applications/${id}`, data),
  deleteApplication: (id) => API.delete(`/applications/${id}`),
  submitApplication: (id) => API.patch(`/applications/${id}/submit`),
  downloadApplication: (id) => API.get(`/applications/${id}/download`, { responseType: 'blob' })
};

// Notification Service
export const notificationService = {
  getMyNotifications: () => API.get('/notifications/my'),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/mark-all-read'),
  deleteNotification: (id) => API.delete(`/notifications/${id}`)
};

// Admin endpoints
export const adminService = {
  // Get all users
  getAllUsers: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return API.get(`/admin/users?${params}`);
  },
  
  // Get user by ID
  getUserById: (userId) => API.get(`/admin/users/${userId}`),
  
  // Update user status
  updateUserStatus: (userId, status) => API.patch(`/admin/users/${userId}/status`, { status }),
  
  // Delete user
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  
  // Reset user password
  resetUserPassword: (userId) => API.post(`/admin/users/${userId}/reset-password`),
  
  // Get all applications
  getAllApplications: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return API.get(`/admin/applications?${params}`);
  },
  
  // Get application by ID
  getApplicationById: (applicationId) => API.get(`/admin/applications/${applicationId}`),
  
  // Download application document
  downloadApplicationDocument: (applicationId, documentId, inline = false) => 
    API.get(`/admin/applications/${applicationId}/documents/${documentId}/download${inline ? '?inline=true' : ''}`, { responseType: 'blob' }),
  
  // Update application status
  updateApplicationStatus: (applicationId, data) => 
    API.patch(`/admin/applications/${applicationId}/status`, data),
  
  // Assign application to reviewer
  assignApplication: (applicationId, reviewerId) =>
    API.patch(`/admin/applications/${applicationId}/assign`, { reviewerId }),
  
  // Get dashboard statistics
  getDashboardStats: () => API.get('/admin/dashboard/stats'),
  
  // Get analytics data
  getAnalytics: (period = '30d') => API.get(`/admin/analytics?period=${period}`),
  
  // Send bulk notifications
  sendBulkNotification: (data) => API.post('/admin/notifications/bulk', data),
  
  // Export applications
  exportApplications: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return API.get(`/admin/applications/export?${params}`, { responseType: 'blob' });
  },
  
  // Export users
  exportUsers: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return API.get(`/admin/users/export?${params}`, { responseType: 'blob' });
  },
  
  // System health check
  getSystemHealth: () => API.get('/admin/system/health')
};

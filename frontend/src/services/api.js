import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Chat API
export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/chat', {
    message,
    history: history.map(msg => ({ role: msg.role, content: msg.content }))
  });
  return response.data;
};

// Mediators API
export const getMediators = async (filters = {}) => {
  const response = await api.get('/mediators', { params: filters });
  return response.data;
};

export const getMediatorById = async (id) => {
  const response = await api.get(`/mediators/${id}`);
  return response.data;
};

export const analyzeMediatorIdeology = async (id) => {
  const response = await api.post(`/mediators/${id}/analyze-ideology`);
  return response.data;
};

/**
 * Check for affiliation conflicts
 * Returns detailed conflict analysis with usage tracking
 */
export const checkMediatorConflicts = async (mediatorIds, parties) => {
  const response = await api.post('/mediators/check-conflicts', {
    mediatorIds,
    parties
  });
  return response.data;
};

// Affiliations API
export const checkAffiliations = async (mediatorIds, parties) => {
  const response = await api.post('/affiliations/check', {
    mediatorIds,
    parties
  });
  return response.data;
};

export const checkAffiliationsQuick = async (mediatorIds, parties) => {
  const response = await api.post('/affiliations/quick-check', {
    mediatorIds,
    parties
  });
  return response.data;
};

export const getMediatorAffiliations = async (id) => {
  const response = await api.get(`/affiliations/mediator/${id}`);
  return response.data;
};

// Authentication API
export const authAPI = {
  /**
   * Register new user
   */
  async register({ email, password, name }) {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data.data;
  },

  /**
   * Login user
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  /**
   * Logout user
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset/request', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/password-reset/confirm', { token, newPassword });
    return response.data.data;
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    const response = await api.put('/auth/me', updates);
    return response.data.data;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Delete account
   */
  async deleteAccount(password) {
    const response = await api.delete('/auth/me', { data: { password } });
    return response.data;
  },
};

export default api;

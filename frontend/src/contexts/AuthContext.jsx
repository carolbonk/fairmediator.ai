import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Configure axios to include credentials (cookies) with every request
axios.defaults.withCredentials = true;

// Helper function to get CSRF token
// Skip in development mode since CSRF protection is disabled
const getCsrfToken = async () => {
  // Skip CSRF token fetch in development mode
  if (import.meta.env.VITE_ENV === 'development' || import.meta.env.MODE === 'development') {
    return null;
  }

  try {
    const response = await axios.get(`${API_URL}/csrf-token`);
    return response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.data.user);
        } catch (err) {
          console.error('Failed to load user:', err);
          // Token might be expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              await refreshAccessToken(refreshToken);
            } catch (refreshErr) {
              // Refresh failed, clear everything
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const refreshAccessToken = async (refreshToken) => {
    // Get CSRF token for refresh
    const csrfToken = await getCsrfToken();

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    }, {
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
    });
    const { accessToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);

    // Load user with new token
    const userResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    setUser(userResponse.data.data.user);
  };

  const register = async (email, password, name, accountType) => {
    try {
      setError(null);

      // Get CSRF token before making the request
      const csrfToken = await getCsrfToken();

      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
        accountType
      }, {
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
      });

      const { user, accessToken, refreshToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const login = async (email, password, accountType) => {
    try {
      setError(null);

      // Get CSRF token before making the request
      const csrfToken = await getCsrfToken();

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        accountType
      }, {
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
      });

      const { user, accessToken, refreshToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken) {
        // Get CSRF token for logout
        const csrfToken = await getCsrfToken();

        await axios.post(
          `${API_URL}/auth/logout`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              ...(csrfToken && { 'x-csrf-token': csrfToken })
            }
          }
        );
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);

      // Get CSRF token for password reset
      const csrfToken = await getCsrfToken();

      await axios.post(`${API_URL}/auth/forgot-password`, { email }, {
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Password reset request failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const confirmResetPassword = async (token, newPassword) => {
    try {
      setError(null);

      // Get CSRF token for password reset confirmation
      const csrfToken = await getCsrfToken();

      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword
      }, {
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Password reset failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    resetPassword,
    confirmResetPassword,
    isPremium: user?.subscriptionTier === 'premium',
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

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

  // Probe the cookie session on mount: if /auth/me succeeds, we're logged in.
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/me`);
        setUser(response.data.data.user);
      } catch {
        // 401 (no/expired session) is the expected unauthenticated path — stay null.
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const refreshAccessToken = async () => {
    const csrfToken = await getCsrfToken();
    await axios.post(`${API_URL}/auth/refresh`, {}, {
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
    });
    const userResponse = await axios.get(`${API_URL}/auth/me`);
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

      setUser(response.data.data.user);
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

      const { user } = response.data.data;
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      const csrfToken = await getCsrfToken();
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
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

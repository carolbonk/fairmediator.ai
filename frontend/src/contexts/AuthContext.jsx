import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });
    const { accessToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);

    // Load user with new token
    const userResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    setUser(userResponse.data.data.user);
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name
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

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
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
        await axios.post(
          `${API_URL}/auth/logout`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
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
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
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
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword
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

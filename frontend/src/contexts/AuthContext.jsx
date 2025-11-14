import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Manages authentication state and provides auth methods to the app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          // Verify token and get user profile
          const userData = await authAPI.getProfile();
          setUser(userData.user);
        } catch (err) {
          // Token invalid or expired, try to refresh
          try {
            await refreshAccessToken();
            const userData = await authAPI.getProfile();
            setUser(userData.user);
          } catch (refreshErr) {
            // Refresh failed, clear tokens
            clearAuth();
          }
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const { accessToken, refreshToken: newRefreshToken } = await authAPI.refreshToken(
      refreshToken
    );

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return accessToken;
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  };

  /**
   * Clear authentication state and tokens
   */
  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setError(null);
  };

  /**
   * Request password reset email
   */
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      await authAPI.requestPasswordReset(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      const response = await authAPI.resetPassword(token, newPassword);

      // Store new tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Change password for authenticated user
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authAPI.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(updates);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete user account
   */
  const deleteAccount = async (password) => {
    try {
      setError(null);
      await authAPI.deleteAccount(password);
      clearAuth();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Verify email with token
   */
  const verifyEmail = async (token) => {
    try {
      setError(null);
      await authAPI.verifyEmail(token);

      // Refresh user data
      const userData = await authAPI.getProfile();
      setUser(userData.user);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Check if user has reached daily limit
   */
  const hasReachedSearchLimit = () => {
    if (!user) return false;
    if (user.subscriptionTier === 'premium') return false;
    return user.usageStats?.searchesToday >= 5;
  };

  const hasReachedProfileViewLimit = () => {
    if (!user) return false;
    if (user.subscriptionTier === 'premium') return false;
    return user.usageStats?.profileViewsToday >= 10;
  };

  /**
   * Check if user is premium
   */
  const isPremium = user?.subscriptionTier === 'premium';

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isPremium,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    deleteAccount,
    verifyEmail,
    refreshAccessToken,
    hasReachedSearchLimit,
    hasReachedProfileViewLimit,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Access authentication state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;

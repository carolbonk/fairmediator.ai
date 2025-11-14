import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TextField from '../common/TextField';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';

/**
 * LoginForm Component with Neomorphic Design
 * Uses shared components: TextField, Button, Checkbox
 */
export default function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }) {
  const { login, error: authError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    clearError();
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem', textAlign: 'center' }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '2rem', textAlign: 'center' }}>
          Sign in to access your FairMediator account
        </p>

        {authError && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
            }}
            role="alert"
          >
            <p style={{ fontSize: '0.875rem', color: '#991B1B', margin: 0 }}>
              <strong>Error:</strong> {authError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
            required
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={errors.password}
            autoComplete="current-password"
            required
            showPasswordToggle
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Checkbox label="Remember me" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />

            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="form-link"
                style={{ fontSize: '0.875rem' }}
              >
                Forgot password?
              </button>
            )}
          </div>

          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {onSwitchToRegister && (
          <>
            <div className="form-divider">
              <span>or</span>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
              Don't have an account?{' '}
              <button type="button" onClick={onSwitchToRegister} className="form-link">
                Sign up
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

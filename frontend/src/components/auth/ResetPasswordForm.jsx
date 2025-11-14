import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TextField from '../common/TextField';
import Button from '../common/Button';

/**
 * Calculate password strength - DRY reuse from RegisterForm
 */
function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: 'weak' };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) return { score, label: 'weak', class: 'password-strength-weak', checks };
  if (score === 3) return { score, label: 'fair', class: 'password-strength-fair', checks };
  if (score === 4) return { score, label: 'good', class: 'password-strength-good', checks };
  return { score, label: 'strong', class: 'password-strength-strong', checks };
}

/**
 * ResetPasswordForm Component - DRY, reuses TextField and Button
 */
export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = 'Password is too weak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!token) {
      setErrors({ newPassword: 'Invalid reset link' });
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, formData.newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors({ newPassword: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-checkmark" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Password Reset!
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Invalid Reset Link
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/forgot-password')}>Request New Link</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem', textAlign: 'center' }}>
          Set New Password
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '2rem', textAlign: 'center' }}>
          Create a strong password for your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <TextField
              label="New Password"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Create a strong password"
              error={errors.newPassword}
              autoComplete="new-password"
              required
              showPasswordToggle
            />
            {formData.newPassword && (
              <div style={{ marginTop: '0.5rem' }}>
                <div className="password-strength-bar">
                  <div className={`password-strength-fill ${passwordStrength.class}`} />
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    Password strength: <strong style={{ textTransform: 'capitalize' }}>{passwordStrength.label}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
            showPasswordToggle
          />

          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

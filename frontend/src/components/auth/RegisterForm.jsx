import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TextField from '../common/TextField';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';

/**
 * Password strength calculator
 * DRY: Reusable utility function
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
 * RegisterForm Component with Neomorphic Design
 * Uses shared components: TextField, Button, Checkbox
 */
export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const { register, error: authError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const passwordStrength = calculatePasswordStrength(formData.password);

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak. Must include uppercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
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
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-checkmark" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Account Created!
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
            We've sent a verification email to <strong>{formData.email}</strong>
          </p>
          <p style={{ fontSize: '0.875rem', color: #6B7280' }}>
            Please check your inbox and click the verification link to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem', textAlign: 'center' }}>
          Create Account
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '2rem', textAlign: 'center' }}>
          Join FairMediator to find the perfect mediator
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
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={errors.name}
            autoComplete="name"
            required
          />

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

          <div className="form-field">
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              error={errors.password}
              autoComplete="new-password"
              required
              showPasswordToggle
            />
            {formData.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div className="password-strength-bar">
                  <div className={`password-strength-fill ${passwordStrength.class}`} />
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    Password strength: <strong style={{ textTransform: 'capitalize' }}>{passwordStrength.label}</strong>
                  </p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                    <li style={{ color: passwordStrength.checks.length ? '#10B981' : '#6B7280' }}>
                      {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                    </li>
                    <li style={{ color: passwordStrength.checks.uppercase ? '#10B981' : '#6B7280' }}>
                      {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                    </li>
                    <li style={{ color: passwordStrength.checks.number ? '#10B981' : '#6B7280' }}>
                      {passwordStrength.checks.number ? '✓' : '○'} One number
                    </li>
                    <li style={{ color: passwordStrength.checks.special ? '#10B981' : '#6B7280' }}>
                      {passwordStrength.checks.special ? '✓' : '○'} One special character
                    </li>
                  </ul>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <Checkbox
              label={
                <span>
                  I agree to the{' '}
                  <a href="/terms" className="form-link">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="form-link">
                    Privacy Policy
                  </a>
                </span>
              }
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              required
            />
            {errors.agreeToTerms && (
              <div className="form-error" style={{ marginTop: '0.5rem' }}>
                <span>⚠</span>
                <span>{errors.agreeToTerms}</span>
              </div>
            )}
          </div>

          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        {onSwitchToLogin && (
          <>
            <div className="form-divider">
              <span>or</span>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
              Already have an account?{' '}
              <button type="button" onClick={onSwitchToLogin} className="form-link">
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

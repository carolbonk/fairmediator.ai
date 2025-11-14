import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TextField from '../common/TextField';
import Button from '../common/Button';

/**
 * ForgotPasswordForm Component - DRY, reuses TextField and Button
 */
export default function ForgotPasswordForm({ onBack }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
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
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setErrors({ email: err.message });
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
            Check Your Email
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            Please check your inbox and click the link to reset your password. The link will expire in 1 hour.
          </p>
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              Back to Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem', textAlign: 'center' }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '2rem', textAlign: 'center' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setErrors({});
            }}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
            required
          />

          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        {onBack && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button type="button" onClick={onBack} className="form-link">
              ← Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

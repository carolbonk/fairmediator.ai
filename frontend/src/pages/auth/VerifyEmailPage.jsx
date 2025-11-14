import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

/**
 * VerifyEmailPage - Handles email verification with token
 * DRY: Reuses Button component and similar success pattern
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError('Invalid verification link');
        setLoading(false);
        return;
      }

      try {
        await verifyEmail(token);
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, verifyEmail, navigate]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '4px', margin: '2rem auto' }} />
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-checkmark" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Email Verified!
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            Your email has been successfully verified. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2rem'
        }}>
          ✕
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          Verification Failed
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
          {error || 'This verification link is invalid or has expired.'}
        </p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    </div>
  );
}

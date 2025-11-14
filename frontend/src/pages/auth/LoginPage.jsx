import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';

/**
 * LoginPage - DRY wrapper around LoginForm
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = () => {
    // Redirect to where user was trying to go, or home
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  return (
    <LoginForm
      onSuccess={handleSuccess}
      onSwitchToRegister={() => navigate('/register')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}

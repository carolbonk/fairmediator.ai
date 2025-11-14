import { useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';

/**
 * RegisterPage - DRY wrapper around RegisterForm
 */
export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // After successful registration, redirect to home or dashboard
    navigate('/', { replace: true });
  };

  return (
    <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => navigate('/login')} />
  );
}

import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

/**
 * ForgotPasswordPage - DRY wrapper around ForgotPasswordForm
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return <ForgotPasswordForm onBack={() => navigate('/login')} />;
}

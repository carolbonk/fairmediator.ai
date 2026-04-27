import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const RoleProtectedRoute = ({ allow, children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!allowed.includes(user.accountType)) {
    return <Navigate to="/dashboard" replace state={{ wrongPortal: true }} />;
  }

  return children ?? <Outlet />;
};

export default RoleProtectedRoute;

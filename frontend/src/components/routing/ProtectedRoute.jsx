import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute Component - DRY wrapper for authenticated routes
 * Redirects to login if not authenticated
 * Optionally checks for premium tier
 */
export default function ProtectedRoute({ children, requirePremium = false }) {
  const { isAuthenticated, isPremium, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#F0F2F5'
      }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Requires premium but user is not premium - redirect to upgrade page
  if (requirePremium && !isPremium) {
    return <Navigate to="/upgrade" state={{ from: location }} replace />;
  }

  // Authenticated and authorized - render children
  return children;
}

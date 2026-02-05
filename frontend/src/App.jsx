import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for code splitting and better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const UpgradePage = lazy(() => import('./components/subscription/UpgradePage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const MediatorApplicationPage = lazy(() => import('./pages/MediatorApplicationPage'));
const EthicsPage = lazy(() => import('./pages/EthicsPage'));
const SafeguardsPage = lazy(() => import('./pages/SafeguardsPage'));
const MediatorsPage = lazy(() => import('./pages/MediatorsPage'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/mediators/apply" element={<MediatorApplicationPage />} />
          <Route path="/ethics" element={<EthicsPage />} />
          <Route path="/safeguards" element={<SafeguardsPage />} />
          <Route path="/mediators" element={<MediatorsPage />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upgrade"
            element={
              <ProtectedRoute>
                <UpgradePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;

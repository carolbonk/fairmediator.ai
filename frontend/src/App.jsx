import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineDetector from './components/OfflineDetector';
import './i18n/config';

// Lazy load pages for code splitting and better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const UpgradePage = lazy(() => import('./components/subscription/UpgradePage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const MediatorApplicationPage = lazy(() => import('./pages/MediatorApplicationPage'));
const EthicsPage = lazy(() => import('./pages/EthicsPage'));
const SafeguardsPage = lazy(() => import('./pages/SafeguardsPage'));
const MediatorsPage = lazy(() => import('./pages/MediatorsPage'));
const SettlementCalculatorPage = lazy(() => import('./pages/SettlementCalculatorPage'));
const MediatorComparisonPage = lazy(() => import('./pages/MediatorComparisonPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const MediatorPortalEntry = lazy(() => import('./pages/app/MediatorPortalEntry'));
const AttorneyPortalEntry = lazy(() => import('./pages/app/AttorneyPortalEntry'));
const PartyPortalEntry = lazy(() => import('./pages/app/PartyPortalEntry'));
const MediatorDashboard = lazy(() => import('./pages/dashboard/MediatorDashboard'));

function App() {
  return (
    <ErrorBoundary>
      <OfflineDetector />
      <HelmetProvider>
        <Router>
          <AuthProvider>
            <WorkspaceProvider>
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
            <Route path="/contact" element={<ContactPage />} />
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
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
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
            <Route
              path="/settlement-calculator"
              element={
                <ProtectedRoute>
                  <SettlementCalculatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <MediatorComparisonPage />
                </ProtectedRoute>
              }
            />

            {/* Role-scoped portal groups */}
            <Route
              path="/app/mediator"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator" />
                </ProtectedRoute>
              }
            >
              <Route index element={<MediatorPortalEntry />} />
              <Route path="crm" element={<MediatorDashboard />} />
              <Route path="marketplace" element={<MediatorDashboard />} />
            </Route>

            <Route
              path="/app/attorney"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="attorney" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AttorneyPortalEntry />} />
            </Route>

            <Route
              path="/app/party"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="party" />
                </ProtectedRoute>
              }
            >
              <Route index element={<PartyPortalEntry />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            </Suspense>
            </WorkspaceProvider>
          </AuthProvider>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

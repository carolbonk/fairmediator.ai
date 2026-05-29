import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// SPA-side fallback for legacy /app/mediator/<sub> links. Production traffic
// hits Netlify's 301s in netlify.toml first; this only fires when a user types
// an old URL directly in dev, or when SPA-internal nav races the edge rewrite.
// Remaps the old "crm" segment to "cases"; other segments pass through.
function LegacyCrmRedirect() {
  const { '*': splat } = useParams();
  if (!splat) return <Navigate to="/mediators-crm/cases" replace />;
  const remapped = splat.replace(/^crm(\/|$)/, 'cases$1');
  return <Navigate to={`/mediators-crm/${remapped}`} replace />;
}
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
const LandingPage = lazy(() => import('./pages/LandingPage'));
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
const ClientPortalEntry = lazy(() => import('./pages/app/ClientPortalEntry'));
const MediatorDashboard = lazy(() => import('./pages/dashboard/MediatorDashboard'));
const ClientDashboard = lazy(() => import('./pages/dashboard/ClientDashboard'));
const CrmCasesPage = lazy(() => import('./pages/app/mediator/CrmCasesPage'));
const CaseWorkspacePage = lazy(() => import('./pages/app/mediator/CaseWorkspacePage'));
const InboxPage = lazy(() => import('./pages/app/mediator/InboxPage'));
const MarketplacePage = lazy(() => import('./pages/app/mediator/MarketplacePage'));
const EarningsCalculatorPage = lazy(() => import('./pages/app/mediator/EarningsCalculatorPage'));
const InvoicesPage = lazy(() => import('./pages/app/mediator/InvoicesPage'));
const HowItWorksMediatorsPage = lazy(() => import('./pages/HowItWorksMediatorsPage'));
const HowItWorksMediatorCrmPage = lazy(() => import('./pages/HowItWorksMediatorCrmPage'));
const HowItWorksMediatorMarketplacePage = lazy(() => import('./pages/HowItWorksMediatorMarketplacePage'));
const FaqMediatorsPage = lazy(() => import('./pages/FaqMediatorsPage'));

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
            <Route path="/" element={<LandingPage />} />
            <Route path="/mediators-marketplace" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/mediators-marketplace/apply" element={<MediatorApplicationPage />} />
            <Route path="/ethics" element={<EthicsPage />} />
            <Route path="/safeguards" element={<SafeguardsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/mediators" element={<Navigate to="/resources/mediators-safeguards" replace />} />
            <Route path="/resources/mediators-safeguards" element={<MediatorsPage />} />

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

            {/* Legacy CRM redirects: /app/mediator/* → /mediators-crm/* */}
            <Route path="/app/mediator/*" element={<LegacyCrmRedirect />} />

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
            </Route>

            {/* CRM routes — /mediators-crm/* */}
            <Route
              path="/mediators-crm"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator" />
                </ProtectedRoute>
              }
            >
              <Route path="cases" element={<CrmCasesPage />} />
              <Route path="cases/:caseId" element={<CaseWorkspacePage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="earnings" element={<EarningsCalculatorPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
            </Route>

            {/* Demand-side portal — attorneys + parties share ClientPortalEntry */}
            <Route
              path="/app/attorney"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="attorney" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientPortalEntry />} />
            </Route>

            <Route
              path="/app/party"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="party" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientPortalEntry />} />
            </Route>

            {/* Role-scoped dashboards (semantic URLs) */}
            <Route
              path="/mediator/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator">
                    <MediatorDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mediator/how-it-works"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator">
                    <HowItWorksMediatorsPage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mediator/how-it-works/crm"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator">
                    <HowItWorksMediatorCrmPage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mediator/how-it-works/marketplace"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator">
                    <HowItWorksMediatorMarketplacePage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mediator/faq"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="mediator">
                    <FaqMediatorsPage />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            {/* Demand-side dashboards — attorneys + parties share ClientDashboard
                 (which selects the right view by accountType). Paths preserved so
                 existing LoginForm redirects keep working. */}
            <Route
              path="/attorney/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="attorney">
                    <ClientDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/party/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow="party">
                    <ClientDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

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

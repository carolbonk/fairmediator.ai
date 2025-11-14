import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/routing/ProtectedRoute';
import ChatPanel from './components/ChatPanel';
import MediatorList from './components/MediatorList';
import Header from './components/Header';
import StatisticsPanel from './components/StatisticsPanel';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

/**
 * HomePage - The main mediator search interface (DRY: extracted from App)
 * Protected route requiring authentication
 */
function HomePage() {
  const [mediators, setMediators] = useState([]);
  const [filters, setFilters] = useState({
    ideology: 'all',
    affiliation: 'all'
  });
  const [parties, setParties] = useState([]);

  const handleChatResponse = (response) => {
    if (response.mediators) {
      setMediators(response.mediators);
    }
  };

  const filteredMediators = {
    liberal: mediators.filter(m => m.ideologyScore <= -1),
    conservative: mediators.filter(m => m.ideologyScore >= 1),
    neutral: mediators.filter(m => m.ideologyScore > -1 && m.ideologyScore < 1)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200">
      <Header />

      {/* Neumorphism layout with generous spacing */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Chat Interface with neumorphism */}
          <div className="card-neu overflow-hidden">
            <ChatPanel
              onResponse={handleChatResponse}
              parties={parties}
              setParties={setParties}
            />
          </div>

          {/* Middle Panel - Mediator Lists with neumorphism */}
          <div className="card-neu overflow-hidden">
            <MediatorList
              liberal={filteredMediators.liberal}
              conservative={filteredMediators.conservative}
              neutral={filteredMediators.neutral}
              parties={parties}
            />
          </div>

          {/* Right Panel - Statistics & Filters */}
          <div className="h-full">
            <StatisticsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * App - Root component with routing and global providers
 * DRY: Centralized routing configuration
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

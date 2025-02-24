// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClientFiles from './pages/ClientFiles';

const App = () => {
  console.log('App initialization - Current path:', window.location.pathname);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full bg-gray-100">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/register-admin"
              element={
                <ProtectedRoute>
                  <AdminRegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/:clientId/files"
              element={
                <ProtectedRoute>
                  <ClientFiles />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;